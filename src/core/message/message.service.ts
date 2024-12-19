import { Injectable } from '@nestjs/common';
import { SessionService } from '../session/session.service';

@Injectable()
export class WhatsappService {
  private attendant_id: string;
  private supportState: Map<string, boolean> = new Map();

  constructor(private sessionService: SessionService) {}

  async createSession(attendantId: string) {
    await this.sessionService.createSession(attendantId);
    this.attendant_id = attendantId;
  }

  async startBot() {
    console.log('Id', this.attendant_id);
    const client = this.sessionService.getClient(this.attendant_id);
    if (!client) throw new Error('Session not found');

    client.ev.on('messages.upsert', async (msg) => {
      if (msg.type === 'notify') {
        for (const message of msg.messages) {
          if (!message.message) continue;

          const sender = message.key.remoteJid!;
          if (!sender) continue;

          const userResponse =
            message.message.conversation ||
            message.message.extendedTextMessage?.text;

          const userMessage = userResponse.trim().toLocaleUpperCase();

          // Verifica se o usuário está no modo de suporte
          if (this.supportState.get(sender)) {
            if (userMessage === 'ENCERRAR SUPORTE') {
              this.supportState.set(sender, false);
              await this.internalSendMessage(
                sender,
                '✅ Suporte encerrado. Voltando ao menu principal.',
              );
            } else {
              // Aqui assumimos que o atendente está tratando as mensagens.
              console.log(
                `Mensagem do usuário em suporte (${sender}): ${userMessage}`,
              );
            }
            continue; // Ignora a lógica do bot enquanto o suporte está ativo
          }

          // Lógica para entrar no modo de suporte
          if (userMessage === 'SUPORTE') {
            this.supportState.set(sender, true);
            await this.internalSendMessage(
              sender,
              '👨‍💻 Você foi direcionado ao suporte. Como posso ajudar?',
            );
            continue;
          }

          // Lógica padrão do bot
          await this.handleUserResponse(client, sender, userResponse);
        }
      }
    });
  }

  async closeSession(attendantId: string) {
    this.sessionService.closeSession(attendantId);
  }

  async sendMessage(
    userNumber: string,
    textMessage: string,
    attendantId: string,
  ) {
    const client = this.sessionService.getClient(attendantId);

    if (!client) throw new Error('Session not found');

    const formattedNumber = userNumber.includes('@s.whatsapp.net')
      ? userNumber
      : `${userNumber}@s.whatsapp.net`;

    // Verifica se o usuário está em suporte antes de enviar a mensagem
    if (this.supportState.get(formattedNumber)) {
      await this.internalSendMessage(formattedNumber, textMessage);
      // throw new Error(
      //   `O usuário ${userNumber} está no suporte e não pode receber mensagens automáticas.`,
      // );
    }
  }

  private async internalSendMessage(userNumber: string, textMessage: string) {
    const client = this.sessionService.getClient(this.attendant_id);

    if (!client) throw new Error('Session not found');

    try {
      await client.sendMessage(userNumber, { text: textMessage });
      console.log(`Mensagem enviada para ${userNumber}`);
    } catch (error) {
      console.error(`Erro ao enviar mensagem para ${userNumber}:`, error);
      throw error;
    }
  }

  private async handleUserResponse(
    client: any,
    sender: string,
    message: string,
  ) {
    const menu = `👋 Olá! Como posso ajudar? Escolha uma das opções abaixo:
    1️⃣ Informações
    2️⃣ Solicitar Formulários
    3️⃣ Falar com o suporte`;

    let reply = '';

    switch (message.trim()) {
      case '1':
        reply = '📚 Aqui estão as informações sobre cursos!';
        break;
      case '2':
        reply =
          '📄 Aqui está o link para os formulários: https://ufsc.br/formularios';
        break;
      case '3':
        reply =
          '📞 Só escrever "SUPORTE" que vamos te direcionar para um de nossos atendentes.';
        break;
      default:
        reply = menu;
    }

    await this.internalSendMessage(sender, reply);
  }
}
