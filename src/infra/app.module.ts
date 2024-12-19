import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AssistantModule } from 'src/core/assistent/assistent.module';
import { AssistantService } from 'src/core/assistent/assistent.service';
import { MessageController } from 'src/core/message/message.controller';
import { MessageModule } from 'src/core/message/message.module';
import { WhatsappService } from 'src/core/message/message.service';
import { SessionService } from 'src/core/session/session.service';
import { CreateConfigUseCase } from 'src/domain/use-cases/config-use-case/create-config-use-case';
import { ConfigurationController } from './http/controllers/config.controller';
import { AIService } from './lib/openai.service';
import { VectorStoreService } from './lib/qdrant.service';
import { SupabaseService } from './lib/supabase/supabase.service';
import { DocumentManagerService } from 'src/core/documents/document-manager.service';
import { DocumentProcessingService } from 'src/core/documents/documents.service';
import { LogService } from './logs/logs.service';
import { AssistantCoreService } from 'src/core/assistent/assistent-core.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      expandVariables: true,
    }),
    MessageModule,
    AssistantModule,
  ],
  controllers: [MessageController, ConfigurationController],
  providers: [
    WhatsappService,
    SessionService,
    AssistantService,
    AIService,
    VectorStoreService,
    CreateConfigUseCase,
    SupabaseService,
    DocumentManagerService,
    DocumentProcessingService,
    LogService,
    AssistantCoreService,
  ],
})
export class AppModule {}
