import { Injectable } from '@nestjs/common';
import { MakeDocUseCase } from 'src/domain/use-cases/doc-use-case/factory/get-doc-factory';
import { VectorStoreService } from 'src/infra/lib/qdrant/qdrant.service';
import { LogService } from 'src/infra/logs/logs.service';
import { DocumentProcessingService } from './documents.service';
import { PrismaConfigService } from 'src/infra/repositories/prisma/config/prisma_config.service';

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
    private readonly documentProcessingService: DocumentProcessingService,
    private readonly vectorStoreService: VectorStoreService,
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
      await this.processDocuments(docs, batch_size);
    } catch (error) {
      this.logService.error('Error during document processing initialization', {
        status: 'error',
        error: error.message,
      });
    }
  }

  async processDocuments(docs: DocumentInfo[], batchSize): Promise<void> {
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
          await this.processSingleDocument(doc);
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

  private async processSingleDocument(doc: DocumentInfo): Promise<void> {
    const { doc_name, doc_link, collection_name, chunk_size, chunk_overlap } =
      doc;

    this.logService.info(`Processing document: ${doc_name}`, {
      status: 'Processing',
      doc_name: doc_name,
      collection_name: collection_name,
      chunk_overlap: chunk_overlap,
      chunk_size: chunk_size,
    });

    const pages = await this.documentProcessingService.loadPDF(doc_link);
    const documentChunks = await this.documentProcessingService.splitDocument(
      pages,
      chunk_size,
      chunk_overlap,
    );

    this.logService.info(
      `Loaded ${pages.length} pages and split into ${documentChunks.length} chunks.`,
      {
        status: 'success',
        doc_name: doc_name,
        page: pages.length,
        chunk: `${documentChunks.length} chunks`,
      },
    );
    await this.vectorStoreService.store_data(documentChunks, collection_name);
    this.logService.info(`Document successfully stored.`, {
      status: 'success',
      doc_name: doc_name,
      collection_name: collection_name,
    });
  }
}
