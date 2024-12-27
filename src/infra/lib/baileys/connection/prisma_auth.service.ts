import { Injectable } from '@nestjs/common';
import { AuthenticationState } from '@whiskeysockets/baileys';
import { PrismaSessionService } from 'src/infra/repositories/prisma/session/prisma_session.service';
import { proto } from '@whiskeysockets/baileys/WAProto';
import { Curve, signedKeyPair } from '@whiskeysockets/baileys/lib/Utils/crypto';
import { generateRegistrationId } from '@whiskeysockets/baileys/lib/Utils/generics';
import { randomBytes } from 'crypto';

@Injectable()
export class PrismaAuthState {
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

  async useAuthState(
    userId: string,
  ): Promise<{ state: AuthenticationState; saveCreds: () => Promise<void> }> {
    let authData = await this.loadSessionFromDatabase(userId);

    // If no session exists, create a new one with initial credentials
    if (!authData || Object.keys(authData).length === 0) {
      authData = { creds: this.initAuthCreds(), keys: {} };
      await this.saveAuthData(userId, authData);
    }

    const state: AuthenticationState = {
      creds: authData.creds || {},
      keys: {
        get: async (type, ids) => {
          const data: Record<string, any> = {};
          await Promise.all(
            ids.map(async (id) => {
              let value = authData.keys?.[type]?.[id];
              if (type === 'app-state-sync-key' && value) {
                value = proto.Message.AppStateSyncKeyData.fromObject(value);
              }
              if (value) data[id] = value;
            }),
          );
          return data;
        },
        set: async (data) => {
          for (const category of Object.keys(data)) {
            for (const id of Object.keys(data[category])) {
              const value = data[category][id];
              if (!authData.keys) authData.keys = {};
              if (!authData.keys[category]) authData.keys[category] = {};
              authData.keys[category][id] = value;
            }
          }
          await this.saveAuthData(userId, authData);
        },
      },
    };

    const saveCreds = async () => {
      await this.saveAuthData(userId, authData);
    };

    return { state, saveCreds };
  }

  private async saveAuthData(userId: string, authData: any): Promise<void> {
    await this.saveSessionToDatabase(userId, authData);
  }

  private async loadSessionFromDatabase(userId: string): Promise<any> {
    const session = await this.prismaSessionService.findOne(userId);
    return session?.auth_data || {};
  }

  private async saveSessionToDatabase(
    userId: string,
    authData: any,
  ): Promise<void> {
    const writeData = async (data: any, id: string) => {
      await this.prismaSessionService.create({
        userId: id,
        auth_data: data,
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
    };

    const existingSession = await this.prismaSessionService.findOne(userId);

    if (existingSession) {
      await this.prismaSessionService.updateSession(
        {
          auth_data: authData,
          status: 'ACTIVE',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
        userId,
      );
    } else {
      await writeData(authData, userId);
    }
  }
}
