import { Injectable } from '@nestjs/common';
import { MakeDocUseCase } from 'src/domain/use-cases/doc-use-case/factory/get-doc-factory';
import { LogService } from 'src/infra/logs/logs.service';
import { PrismaConfigService } from 'src/infra/repositories/prisma/config/prisma_config.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

interface DocumentInfo {
  doc_name: string;
  collection_name: string;
  chunk_size: number;
  chunk_overlap: number;
  doc_link: string;
}

@Injectable()
export class DocumentManagerService {
  constructor(
    @InjectQueue('documents-queues') private documentQueue: Queue,
    private readonly logService: LogService,
    private readonly prismaConfigService: PrismaConfigService,
  ) {}

  async startProcessing() {
    try {
      const getDocs = MakeDocUseCase();
      const { docs } = await getDocs.execute();
      const batchSize = (await this.prismaConfigService.findGeneralConfig())
        ?.batch_size;

      if (docs.length === 0) {
        this.logService.warn('No documents to process.', {
          status: 'warning',
          total_documents: docs.length,
        });
        return;
      }

      this.logService.info(`Starting processing documents`, {
        status: 'Processing',
        total_documents: docs.length,
      });
      const batch_size = batchSize ? batchSize : 5;
      await this.processDocumentsInBatches(docs, batch_size);
    } catch (error) {
      this.logService.error('Error during document processing initialization', {
        status: 'error',
        error: error.message,
      });
    }
  }

  async processDocumentsInBatches(
    docs: DocumentInfo[],
    batchSize,
  ): Promise<void> {
    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = docs.slice(i, i + batchSize);
      this.logService.info(`Processing batch`, {
        status: 'Processing',
        batch_number: i / batchSize + 1,
        total_batches: Math.ceil(docs.length / batchSize),
        batch_size: batch.length,
        total_documents: docs.length,
      });

      for (const doc of batch) {
        try {
          await this.documentQueue.add(
            'document_processor',
            {
              doc: doc,
            },
            {
              delay: 5000,
            },
          );
        } catch (error) {
          this.logService.error('Failed to process document', {
            status: 'error',
            doc_name: doc.doc_name,
            error: error.message,
          });
        }
      }
    }

    this.logService.info('All documents processed successfully.', {
      status: 'success',
      total_documents: docs.length,
      total_batches: Math.ceil(docs.length / batchSize),
    });
  }
}
