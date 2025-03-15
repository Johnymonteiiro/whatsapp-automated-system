import { Injectable } from '@nestjs/common';
import { proto } from '@whiskeysockets/baileys/WAProto';
import { Curve, signedKeyPair } from '@whiskeysockets/baileys/lib/Utils/crypto';
import { generateRegistrationId } from '@whiskeysockets/baileys/lib/Utils/generics';
import { AuthenticationCreds } from '@whiskeysockets/baileys/lib/Types';
import { randomBytes } from 'crypto';
import { PrismaSessionService } from 'src/infra/repositories/prisma/session/prisma_session.service';

interface AuthState {
  creds: AuthenticationCreds;
  keys: {
    get: (type: string, ids: string[]) => Promise<Record<string, any>>;
    set: (data: Record<string, Record<string, any>>) => Promise<void>;
  };
}

const initAuthCreds = () => {
  const identityKey = Curve.generateKeyPair();
  return {
    noiseKey: Curve.generateKeyPair(),
    signedIdentityKey: identityKey,
    signedPreKey: signedKeyPair(identityKey, 1),
    registrationId: generateRegistrationId(),
    advSecretKey: randomBytes(32).toString('base64'),
    processedHistoryMessages: [],
    nextPreKeyId: 1,
    firstUnuploadedPreKeyId: 1,
    accountSettings: {
      unarchiveChats: false,
    },
  };
};

const BufferJSON = {
  replacer: (key: string, value: any): any => {
    if (
      Buffer.isBuffer(value) ||
      value instanceof Uint8Array ||
      value?.type === 'Buffer'
    ) {
      return {
        type: 'Buffer',
        data: Buffer.from(value?.data || value).toString('base64'),
      };
    }

    return value;
  },

  reviver: (_: string, value: any): any => {
    if (
      typeof value === 'object' &&
      !!value &&
      (value.buffer === true || value.type === 'Buffer')
    ) {
      const val = value.data || value.value;
      return typeof val === 'string'
        ? Buffer.from(val, 'base64')
        : Buffer.from(val || []);
    }

    return value;
  },
};

@Injectable()
export class PrismaAuthStateService {
  constructor(private prismaSessionService: PrismaSessionService) {}

  private async writeData(
    data: any,
    sessionId: string,
    userId: string,
  ): Promise<void> {
    const userExists = await this.prismaSessionService.userExists(userId);
    if (!userExists) {
      throw new Error(`User with ID ${userId} does not exist.`);
    }
    await this.prismaSessionService.upsertSession(data, userId, sessionId);
  }

  private async readData(userId: string): Promise<any> {
    try {
      const session = await this.prismaSessionService.findOne(userId);
      return session?.auth_data
        ? JSON.parse(JSON.stringify(session.auth_data), BufferJSON.reviver)
        : null;
    } catch (error) {
      console.error(`Error reading session for key "${userId}":`, error);
      return null;
    }
  }

  private async removeData(userId: string): Promise<void> {
    await this.prismaSessionService.delete(userId);
  }

  async useAuthState(
    userId: string,
  ): Promise<{ state: AuthState; saveCreds: () => void }> {
    const sessionKey = `${userId}-auth-creds`;
    const creds = (await this.readData(sessionKey)) || initAuthCreds();

    return {
      state: {
        creds,
        keys: {
          get: async (
            type: string,
            ids: string[],
          ): Promise<Record<string, any>> => {
            const data: Record<string, any> = {};
            await Promise.all(
              ids.map(async (id) => {
                const key = `${userId}-${type}-${id}`;
                let value = await this.readData(key);
                if (type === 'app-state-sync-key') {
                  value = proto.Message.AppStateSyncKeyData.fromObject(value);
                }
                data[id] = value;
              }),
            );
            return data;
          },
          set: async (
            data: Record<string, Record<string, any>>,
          ): Promise<void> => {
            const tasks: Promise<void>[] = [];
            for (const category of Object.keys(data)) {
              for (const id of Object.keys(data[category])) {
                const value = data[category][id];
                const key = `${userId}-${category}-${id}`;
                if (value) {
                  tasks.push(this.writeData(value, key, userId));
                } else {
                  tasks.push(this.removeData(key));
                }
              }
            }
            await Promise.all(tasks);
          },
        },
      },
      saveCreds: (): void => {
        this.writeData(creds, sessionKey, userId);
      },
    };
  }
}
