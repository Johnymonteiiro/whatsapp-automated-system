import { Injectable } from '@nestjs/common';
import makeWASocket, {
  ConnectionState,
  DisconnectReason,
  // useMultiFileAuthState,
  WASocket,
} from '@whiskeysockets/baileys';
import Pino, { Logger } from 'pino';
import { PrismaAuthStateService } from './prisma_auth.service';
import { Boom } from '@hapi/boom';
import * as QRCode from 'qrcode';

@Injectable()
export class ConnectionService {
  private logger: Logger;
  private client: WASocket | null = null;
  private qrCode: string | null = null;

  constructor(private readonly prismaAuthStateService: PrismaAuthStateService) {
    this.logger = Pino({
      level: 'info',
      transport: {
        target: 'pino-pretty',
        options: { colorize: true },
      },
    });
  }

  private async initializeClient(userId: string): Promise<void> {
    const { state, saveCreds } =
      await this.prismaAuthStateService.useAuthState();

    // const { state, saveCreds } = await useMultiFileAuthState(`${userId}`);

    if (!state.creds || typeof state.creds !== 'object') {
      throw new Error(
        'Invalid credentials: Credentials object is missing or malformed',
      );
    }

    this.client = makeWASocket({
      auth: state,
      logger: this.logger as any,
      printQRInTerminal: false,
      qrTimeout: 30000,
      version: await this.fetchLatestBaileysVersion(),
      syncFullHistory: false,
    });

    this.client.ev.on(
      'connection.update',
      async (update: Partial<ConnectionState>) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          QRCode.toDataURL(qr).then((url: string) => {
            this.qrCode = url;
            this.logger.info(
              `QR Code generated for user ${userId}. Waiting for scan...`,
            );
          });
        }

        if (connection === 'open') {
          this.logger.info(`Session for user ${userId} is now connected.`);
        }

        if (connection === 'close') {
          const statusCode = (lastDisconnect?.error as Boom)?.output
            ?.statusCode;
          const shouldReconnect =
            statusCode !== DisconnectReason.loggedOut && statusCode !== 408;

          this.logger.warn(
            `Connection closed for user ${userId}. Reconnecting: ${shouldReconnect}`,
          );

          if (shouldReconnect) {
            await this.createSession(userId);
          } else {
            this.logger.error(
              `User ${userId} logged out. Session must be recreated.`,
            );
          }
        }
      },
    );

    this.client.ev.on('creds.update', saveCreds);
  }

  async createSession(userId: string): Promise<void> {
    try {
      await this.initializeClient(userId);
      this.logger.info(`Session for user ${userId} created.`);
    } catch (error) {
      console.error('Failed to initialize session:', error);
    }
  }

  getQRCode(): string | null {
    return this.qrCode;
  }

  getClient(): WASocket | null {
    return this.client;
  }

  private async fetchLatestBaileysVersion() {
    const { version } = await import('@whiskeysockets/baileys/lib/Utils').then(
      (utils) => utils.fetchLatestBaileysVersion(),
    );
    return version;
  }
}
