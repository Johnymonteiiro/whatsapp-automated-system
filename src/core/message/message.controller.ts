import { Body, Controller, Get, Post } from '@nestjs/common';
import { WhatsappService } from './message.service';
// import { Message } from './message.interface';

export class CreateSessionDto {
  attendantId: string;
}

export class CreateMessageDTO {
  userNumber: string;
  textMessage: string;
  attendantId: string;
}

@Controller('whatsapp')
export class MessageController {
  constructor(private whatsappService: WhatsappService) {}

  @Get('status')
  getStatus() {
    return { status: 'WhatsApp bot is running' };
  }

  @Post('session/create')
  createSession(@Body() { attendantId }: CreateSessionDto) {
    this.whatsappService.createSession(attendantId);
    return { message: `Session for ${attendantId} created.` };
  }

  @Post('session/start-bot')
  startBot() {
    this.whatsappService.startBot();
    return { message: `Bot initialized` };
  }

  @Post('session/close')
  closeSession(@Body() { attendantId }: CreateSessionDto) {
    this.whatsappService.closeSession(attendantId);
    return { message: `Session for ${attendantId} closed.` };
  }

  @Post('message/send')
  async sendMessage(
    @Body() { userNumber, textMessage, attendantId }: CreateMessageDTO,
  ) {
    await this.whatsappService.sendMessage(
      userNumber,
      textMessage,
      attendantId,
    );
    return { message: `Message sent to ${userNumber}` };
  }
}
