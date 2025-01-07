import { Injectable } from '@nestjs/common';
import { proto } from '@whiskeysockets/baileys/WAProto';
import { AuthenticationState } from '@whiskeysockets/baileys/lib/Types';
import { Curve, signedKeyPair } from '@whiskeysockets/baileys/lib/Utils/crypto';
import { generateRegistrationId } from '@whiskeysockets/baileys/lib/Utils/generics';
import { randomBytes } from 'crypto';
import { PrismaSessionService } from 'src/infra/repositories/prisma/session/prisma_session.service';

@Injectable()
export class PrismaAuthStateService {
  constructor(private prismaSessionService: PrismaSessionService) {}

  private initAuthCreds() {
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
  }

  private BufferJSON = {
    replacer: (k: string, value: any) => {
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
    reviver: (_: string, value: any) => {
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

  async useAuthState(
    userId: string,
  ): Promise<{ state: AuthenticationState; saveCreds: () => Promise<void> }> {
    const writeData = async (data: any, id: string) => {
      const serializedData = JSON.parse(
        JSON.stringify(data, this.BufferJSON.replacer),
      );
      await this.prismaSessionService.create({
        userId,
        id,
        auth_data: serializedData,
      });
    };

    const readData = async (userId: string) => {
      const session = await this.prismaSessionService.findOne(userId);
      if (!session?.auth_data) return null;
      return JSON.parse(
        JSON.stringify(session.auth_data),
        this.BufferJSON.reviver,
      );
    };

    // const removeData = async (id: string) => {
    //   await this.prismaSessionService.delete(userId);
    // };

    const creds = (await readData('creds')) || this.initAuthCreds();

    return {
      state: {
        creds,
        keys: {
          get: async (type: string, ids: string[]) => {
            const data: Record<string, any> = {};
            await Promise.all(
              ids.map(async (id) => {
                let value = await readData(`${type}-${id}`);
                if (type === 'app-state-sync-key') {
                  value = proto.Message.AppStateSyncKeyData.fromObject(value);
                }
                data[id] = value;
              }),
            );
            return data;
          },
          set: async (data: Record<string, Record<string, any>>) => {
            const tasks = [];
            for (const category of Object.keys(data)) {
              for (const id of Object.keys(data[category])) {
                const value = data[category][id];
                const key = `${category}-${id}`;
                tasks.push(value ? writeData(value, key) : null); // removeData(key),;
              }
            }
            await Promise.all(tasks);
          },
        },
      },
      saveCreds: async () => {
        await writeData(creds, 'creds');
      },
    };
  }
}
