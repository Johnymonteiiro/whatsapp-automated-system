import { Module } from '@nestjs/common';
import { ConfigurationController } from 'src/infra/http/controllers/config.controller';
import { AIService } from 'src/infra/lib/openAI/openai.service';
import { SupabaseService } from 'src/infra/lib/supabase/supabase.service';
import { LogService } from 'src/infra/logs/logs.service';
import { DocumentManagerService } from '../documents/document-manager.service';
import { DocumentProcessingService } from '../documents/documents.service';
import { AssistantCoreService } from './assistent-core.service';
import { AssistantService } from './assistent.service';
import { VectorStoreService } from 'src/infra/lib/qdrant/qdrant.service';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { PrismaDocService } from 'src/infra/repositories/prisma/doc/prisma_doc.service';
import { PrismaConfigService } from 'src/infra/repositories/prisma/config/prisma_config.service';

@Module({
  controllers: [ConfigurationController],
  providers: [
    AssistantService,
    AssistantCoreService,
    AIService,
    VectorStoreService,
    SupabaseService,
    DocumentManagerService,
    DocumentProcessingService,
    LogService,
    PrismaService,
    PrismaDocService,
    PrismaConfigService,
  ],
  exports: [AssistantService],
})
export class AssistantModule {}
