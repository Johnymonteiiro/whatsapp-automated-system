import { Module } from '@nestjs/common';
import { WhatsappService } from './message.service';
import { SessionService } from '../session/session.service';
import { MessageController } from './message.controller';

@Module({
  controllers: [MessageController],
  providers: [WhatsappService, SessionService],
  exports: [WhatsappService],
})
export class MessageModule {}
