import { Injectable } from '@nestjs/common';
// import makeWASocket from '@whiskeysockets/baileys';
// import Pino, { Logger } from 'pino';
import { PrismaAuthState } from './prisma_auth.service';

@Injectable()
export class ConnectionService {
  constructor(private readonly prismaAuthState: PrismaAuthState) {}

  async createSession(userId: string) {
    try {
      const { state, saveCreds } =
        await this.prismaAuthState.useAuthState(userId);

      console.log('state', state);
      console.log('saveCreds', saveCreds);

      // Configure the logger
      // const logger: Logger = Pino({
      //   level: 'info',
      //   customLevels: {
      //     log: 30,
      //   },
      //   transport: {
      //     target: 'pino-pretty',
      //     options: { colorize: true },
      //   },
      // });

      // const client = makeWASocket({
      //   auth: state,
      //   logger: logger as any,
      //   printQRInTerminal: false,
      //   browser: ['Custom Client', 'Safari', '1.0.0'],
      //   qrTimeout: 30000,
      //   version: await this.fetchLatestBaileysVersion(),
      //   syncFullHistory: false,
      // });

      // Handle QR code and session state updates
      // client.ev.on(
      //   'connection.update',
      //   async (update: Partial<ConnectionState>) => {
      //     const { connection, lastDisconnect, qr } = update;

      //     if (qr) {
      //       logger.info(
      //         `QR Code generated for user ${userId}. Waiting for scan...`,
      //       );
      //     }

      //     if (connection === 'open') {
      //       logger.info(`Session for user ${userId} is now connected.`);
      //     }

      //     if (connection === 'close') {
      //       const statusCode = (lastDisconnect?.error as Boom)?.output
      //         ?.statusCode;
      //       const shouldReconnect =
      //         statusCode !== DisconnectReason.loggedOut && statusCode !== 408;

      //       logger.warn(
      //         `Connection closed for user ${userId}. Reconnecting: ${shouldReconnect}`,
      //       );

      //       if (shouldReconnect) {
      //         await this.createSession(userId);
      //       } else {
      //         logger.error(
      //           `User ${userId} logged out. Session must be recreated.`,
      //         );
      //       }
      //     }
      //   },
      // );

      // Save credentials on any update
      // client.ev.on('creds.update', saveCreds);

      // logger.info(`Session for user ${userId} created.`);
    } catch (error) {
      console.error('Failed to initialize session:', error);
    }
  }

  // private async fetchLatestBaileysVersion() {
  //   const { version } = await import('@whiskeysockets/baileys/lib/Utils').then(
  //     (utils) => utils.fetchLatestBaileysVersion(),
  //   );
  //   return version;
  // }
}
