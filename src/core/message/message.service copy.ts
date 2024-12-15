import { Injectable } from '@nestjs/common';
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  ConnectionState,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';

@Injectable()
export class WhatsappService {
  private socket: ReturnType<typeof makeWASocket>;

  constructor() {
    this.initialize();
  }

  async initialize() {
    try {
      const { state, saveCreds } =
        await useMultiFileAuthState('auth_info_baileys');
      this.socket = makeWASocket({
        auth: state,
        printQRInTerminal: true,
      });

      this.socket.ev.on('creds.update', saveCreds);

      this.socket.ev.on(
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

            if (statusCode === 408) {
              console.warn('QR code attempts ended; retrying initialization.');
            }

            if (shouldReconnect) {
              await new Promise((res) => setTimeout(res, 5000));
              this.initialize();
            } else {
              console.error(
                'Logged out or QR generation timed out, not reconnecting.',
              );
            }
          } else if (connection === 'open') {
            console.log('Opened connection');
          }
        },
      );

      this.socket.ev.on('messages.upsert', async (msg) => {
        if (msg.type !== 'notify') return;
        for (const message of msg.messages) {
          if (!message.message) continue;
          const sender = message.key.remoteJid!;
          const text = message.message.conversation || '';
          try {
            await this.sendMenu(sender);
            await this.handleMessage(sender, text);
          } catch (error) {
            console.error('Failed to handle incoming message:', error);
          }
        }
      });
    } catch (error) {
      console.error('Failed to initialize socket:', error);
      if ((error as Boom)?.output?.statusCode === 408) {
        console.warn('Retrying due to QR code timeout...');
        await new Promise((res) => setTimeout(res, 5000));
        this.initialize();
      }
    }
  }

  async sendMenu(sender: string) {
    try {
      await this.socket.sendMessage(sender, {
        text: '',
      });
    } catch (error) {
      console.error('Failed to send menu:', error);
    }
  }

  async handleMessage(sender: string, text: string) {
    try {
      switch (text.trim()) {
        case '1':
          await this.socket.sendMessage(sender, {
            text: 'This page is under development',
          });
          break;
        case '2':
          await this.socket.sendMessage(sender, {
            text: 'Hi, this was sent using https://github.com/adiwajshing/baileys',
          });
          break;
        case '3':
          await this.socket.sendMessage(sender, {
            text: 'As pesquisas ainda não estão disponivéis',
          });
          break;
        case '4':
          await this.socket.sendMessage(sender, {
            text: 'Vamos liberar já as perguntas aqui!',
          });
          break;
        case '5':
          await this.socket.sendMessage(sender, {
            text: 'Vamos direcionar vc para o suporte!',
          });
          break;
        case 'menu':
          this.sendMenu(sender);
          break;
        default:
          await this.socket.sendMessage(sender, {
            text: 'Opção inválida. Digite "menu" para ver as opções',
          });
          break;
      }
    } catch (error) {
      console.error('Failed to handle user message:', error);
    }
  }
}
