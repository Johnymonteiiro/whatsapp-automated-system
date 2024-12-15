import { Boom } from '@hapi/boom';
import { Injectable } from '@nestjs/common';
import makeWASocket, {
  ConnectionState,
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
} from '@whiskeysockets/baileys';
import * as fs from 'fs';
import * as path from 'path';

interface Session {
  attendantId: string;
  client: WASocket;
}

const authPath = path.join(process.cwd(), 'src', 'auth');

if (!fs.existsSync(authPath)) {
  fs.mkdirSync(authPath, { recursive: true });
}

@Injectable()
export class SessionService {
  private sessions: Map<string, Session> = new Map();

  async createSession(attendantId: string) {
    // if (this.sessions.has(attendantId)) {
    //   console.log(`Session for attendant ${attendantId} already exists.`);
    //   return;
    // }

    try {
      const { state, saveCreds } = await useMultiFileAuthState(
        path.join(authPath, `auth_info_baileys_${attendantId}`),
      );

      const client = makeWASocket({
        auth: state,
        printQRInTerminal: true,
      });

      client.ev.on('creds.update', saveCreds);

      client.ev.on(
        'connection.update',
        async (update: Partial<ConnectionState>) => {
          const { connection, lastDisconnect } = update;
          if (connection === 'close') {
            const statusCode = (lastDisconnect?.error as Boom)?.output
              ?.statusCode;
            const shouldReconnect =
              statusCode !== DisconnectReason.loggedOut && statusCode !== 408;

            console.log(
              'Connection closed due to',
              lastDisconnect?.error,
              ', reconnecting:',
              shouldReconnect,
            );

            if (shouldReconnect) {
              await this.createSession(attendantId);
            }
          } else if (connection === 'open') {
            console.log(`Session for ${attendantId} is connected.`);
          }
        },
      );
      this.sessions.set(attendantId, { attendantId, client });
      console.log(`Session for ${attendantId} created.`);
    } catch (error) {
      console.error('Failed to initialize session:', error);
    }
  }

  closeSession(attendantId: string) {
    const session = this.sessions.get(attendantId);
    if (session) {
      session.client.end(null);
      this.sessions.delete(attendantId);
      console.log(`Session for ${attendantId} closed.`);

      const folderPath = path.join(
        authPath,
        `auth_info_baileys_${attendantId}`,
      );
      if (fs.existsSync(folderPath)) {
        try {
          fs.rmSync(folderPath, { recursive: true, force: true });
          console.log(`Folder ${folderPath} deleted successfully.`);
        } catch (error) {
          console.error(`Error deleting folder ${folderPath}:`, error);
        }
      } else {
        console.log(`Folder ${folderPath} does not exist.`);
      }
    } else {
      console.log(`No active session found for ${attendantId}.`);
    }
  }

  getSession(attendantId: string): Session | undefined {
    return this.sessions.get(attendantId);
  }

  getClient(attendantId: string): WASocket | undefined {
    return this.sessions.get(attendantId)?.client;
  }
}
