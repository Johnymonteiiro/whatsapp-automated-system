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
  private storage: Map<string, any> = new Map();

  constructor(private prismaSessionService: PrismaSessionService) {}

  private async writeData(data: any, sessionId: string): Promise<void> {
    this.storage.set(
      sessionId,
      JSON.parse(JSON.stringify(data, BufferJSON.replacer)),
    );
    // const session = await this.prismaSessionService.findOne(sessionId);

    // if (session) {
    //   this.prismaSessionService.updateSession(
    //     {
    //       auth_data: data,
    //       updatedAt: new Date(),
    //       expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    //     },
    //     userId,
    //   );
    // }

    this.prismaSessionService.upsertSession(
      data,
      'edcca8c6-86bd-40ca-ac79-aaf5baef3cd4',
      sessionId,
    );
  }

  private async readData(sessionId: string): Promise<any> {
    try {
      const data = this.storage.get(sessionId);
      return data ? JSON.parse(JSON.stringify(data), BufferJSON.reviver) : null;
      //   : null;;
      // const session = await this.prismaSessionService.findOne(sessionId);
      // return session.auth_data
      //   ? JSON.parse(JSON.stringify(session.auth_data), BufferJSON.reviver)
      //   : null;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  private async removeData(userId: string): Promise<void> {
    this.storage.delete(userId);
    // this.prismaSessionService.delete(userId);
  }

  async useAuthState(): Promise<{ state: AuthState; saveCreds: () => void }> {
    const creds = (await this.readData('creds')) || initAuthCreds();

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
                let value = await this.readData(`${type}-${id}`);
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
                const key = `${category}-${id}`;
                if (value) {
                  tasks.push(Promise.resolve(this.writeData(value, key)));
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
        this.writeData(creds, 'creds');
      },
    };
  }

  getSession() {
    return this.storage.get('creds');
  }
}
