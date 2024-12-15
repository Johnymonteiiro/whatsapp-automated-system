import { Module } from '@nestjs/common';
import { SessionService } from 'src/core/session/session.service';
import { WhatsappService } from './message.service';
import { MessageController } from './message.controller';

@Module({
  imports: [MessageModule],
  exports: [MessageModule],
  controllers: [MessageController],
  providers: [WhatsappService, SessionService],
})
export class MessageModule {}
