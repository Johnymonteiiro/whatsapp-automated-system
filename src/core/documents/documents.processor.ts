import { Processor, Process, OnQueueProgress } from '@nestjs/bull';
import { Job } from 'bull';
import { LogService } from 'src/infra/logs/logs.service';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document as langchainDocument } from 'langchain/document';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { Document } from '@prisma/client';
import { VectorStoreService } from 'src/infra/lib/qdrant/qdrant.service';

@Processor('documents-queues')
export class DocumentProcessor {
  constructor(
    private readonly vectorStoreService: VectorStoreService,
    private readonly logService: LogService,
  ) {}

  @Process('document_processor')
  async handleDocument(job: Job<{ doc: Document }>) {
    const { chunk_overlap, chunk_size, collection_name, doc_link, doc_name } =
      job.data.doc;

    try {
      // Etapa 1: Download do documento
      job.progress(10); // Atualiza progresso para 10%
      const pages = await this.loadingDocument(doc_link);
      job.progress(40); // Atualiza progresso para 40%

      // Etapa 2: Divisão em chunks
      const document_chunks = await this.splitDocument(
        pages,
        chunk_size,
        chunk_overlap,
      );
      job.progress(70); // Atualiza progresso para 70%

      // Etapa 3: Armazenamento no Vector Store
      await this.vectorStoreService.store_data(
        document_chunks,
        collection_name,
      );
      job.progress(100); // Atualiza progresso para 100%

      this.logService.info(`Job completed successfully`, {
        status: 'success',
        job_id: job.id,
      });
      this.logService.info(`Document successfully stored.`, {
        status: 'success',
        doc_name: doc_name,
        collection_name: collection_name,
      });
    } catch (error) {
      this.logService.error(`Error processing the document`, {
        status: 'error',
        error: error.message,
        job_id: job.id,
      });
    }
  }

  protected async downloadDocument(doc_url: string): Promise<ArrayBuffer> {
    try {
      const response = await fetch(doc_url);
      if (!response.ok) {
        this.logService.warn(`Failed to fetch PDF: ${response.statusText}`, {
          status: response.statusText,
          doc_url: doc_url,
        });
      }

      this.logService.info(`Downloaded document successfully`, {
        status: 'success',
        doc_url: doc_url,
      });

      return await response.arrayBuffer();
    } catch (error) {
      this.logService.error(`Error downloading PDF from URL: ${doc_url}`, {
        status: 'error',
        error: error.message,
        doc_url: doc_url,
      });
    }
  }

  protected async loadingDocument(
    doc_url: string,
  ): Promise<langchainDocument<Record<string, any>>[]> {
    try {
      const arrayBuffer = await this.downloadDocument(doc_url);
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });

      const loader = new PDFLoader(blob, { splitPages: true });
      const pages = await loader.load();

      this.logService.info(`Successfully loaded PDF.`, {
        status: 'success',
        pages: `${pages.length} loaded`,
      });
      return pages;
    } catch (error) {
      this.logService.error(`Error loading PDF`, {
        status: 'error',
        doc_url: doc_url,
        error: error.message,
      });
    }
  }

  protected async splitDocument(
    pages: langchainDocument<Record<string, any>>[],
    chunk_size: number,
    chunk_overlap: number,
  ): Promise<langchainDocument<Record<string, any>>[]> {
    try {
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: chunk_size,
        chunkOverlap: chunk_overlap,
        lengthFunction: (text) => text.length,
      });

      const chunks = await textSplitter.splitDocuments(pages);
      this.logService.info(`Successfully split document`, {
        status: 'success',
        chunks: `${chunks.length} chunks`,
      });
      return chunks;
    } catch (error) {
      this.logService.error(`Error splitting document`, {
        status: 'error',
        error: error.message,
      });
    }
  }

  @OnQueueProgress()
  handleQueueProgress(job: Job, progress: number) {
    this.logService.info(`Job ${job.name} progress: ${progress}%`, {
      job_id: job.id,
      progress,
    });
  }
}
