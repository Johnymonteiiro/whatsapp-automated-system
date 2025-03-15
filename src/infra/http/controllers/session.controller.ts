import { Body, Controller, Get, Post } from '@nestjs/common';
import { ConnectionService } from 'src/infra/lib/baileys/connection/connection.service';
import { PrismaAuthStateService } from 'src/infra/lib/baileys/connection/prisma_auth.service';
// import * as QRCode from 'qrcode';

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
  constructor(
    private connectionService: ConnectionService,
    private readonly prismaAuthStateService: PrismaAuthStateService,
  ) {}

  @Get('/qr_code')
  async getQrcode() {
    const qrCode = this.connectionService.getQRCode();
    return `<img src="${qrCode}" alt="QR Code" />`;
  }

  // @Get('/session')
  // async getSessioin() {
  //   const session = this.prismaAuthStateService.getSession();
  //   return { session };
  // }

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
