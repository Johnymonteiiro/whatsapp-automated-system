import { Module } from '@nestjs/common';
import { CreateConfigUseCase } from 'src/domain/use-cases/config-use-case/create-config-use-case';
import { ConfigurationController } from 'src/infra/http/controllers/config.controller';
import { AIService } from 'src/infra/lib/openai.service';
import { VectorStoreService } from 'src/infra/lib/qdrant.service';
import { AssistantService } from './assistent.service';
import { SupabaseService } from 'src/infra/lib/supabase/supabase.service';
import { DocumentManagerService } from '../documents/document-manager.service';
import { DocumentProcessingService } from '../documents/documents.service';
import { LogService } from 'src/infra/logs/logs.service';
import { AssistantCoreService } from './assistent-core.service';

@Module({
  imports: [AssistantModule],
  exports: [AssistantModule],
  controllers: [ConfigurationController],
  providers: [
    AssistantService,
    VectorStoreService,
    AIService,
    CreateConfigUseCase,
    SupabaseService,
    DocumentManagerService,
    DocumentProcessingService,
    LogService,
    AssistantCoreService,
  ],
})
export class AssistantModule {}
