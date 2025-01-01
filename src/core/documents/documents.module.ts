import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
// import { ConfigModule, ConfigService } from '@nestjs/config';
import { DocumentManagerService } from './document-manager.service';
import { DocumentProcessor } from './documents.processor';
import { VectorStoreService } from 'src/infra/lib/qdrant/qdrant.service';
import { PrismaConfigService } from 'src/infra/repositories/prisma/config/prisma_config.service';
import { LogService } from 'src/infra/logs/logs.service';
import { AIService } from 'src/infra/lib/openAI/openai.service';
import { PrismaEnvironmentsService } from 'src/infra/repositories/prisma/environments/prisma_env.service';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'documents-queues',
    }),
  ],
  providers: [
    DocumentManagerService,
    DocumentProcessor,
    VectorStoreService,
    PrismaConfigService,
    LogService,
    AIService,
    PrismaEnvironmentsService,
    PrismaService,
  ],
  exports: [BullModule, DocumentManagerService, DocumentProcessor],
})
export class DocumentsModule {}
