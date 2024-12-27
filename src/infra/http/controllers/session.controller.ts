import { Body, Controller, Get, Post } from '@nestjs/common';
import { ConnectionService } from 'src/infra/lib/baileys/connection/connection.service';

export class CreateSessionDto {
  attendantId: string;
}

export class CreateMessageDTO {
  userNumber: string;
  textMessage: string;
  attendantId: string;
}

@Controller('session')
export class SessionController {
  constructor(private connectionService: ConnectionService) {}

  @Get('status')
  getStatus() {
    return { status: 'WhatsApp bot is running' };
  }

  @Post('/create')
  createSession(@Body() { attendantId }: CreateSessionDto) {
    this.connectionService.createSession(attendantId);
    return { message: `Session for ${attendantId} created.` };
  }

  // @Post('session/close')
  // closeSession(@Body() { attendantId }: CreateSessionDto) {
  //   this.whatsappService.closeSession(attendantId);
  //   return { message: `Session for ${attendantId} closed.` };
  // }

  // @Post('message/send')
  // async sendMessage(
  //   @Body() { userNumber, textMessage, attendantId }: CreateMessageDTO,
  // ) {
  //   await this.whatsappService.sendMessage(
  //     userNumber,
  //     textMessage,
  //     attendantId,
  //   );
  //   return { message: `Message sent to ${userNumber}` };
  // }
}
