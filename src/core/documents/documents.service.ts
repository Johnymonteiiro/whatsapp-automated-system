import { Injectable } from '@nestjs/common';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { Document } from 'langchain/document';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { LogService } from 'src/infra/logs/logs.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class DocumentProcessingService {
  constructor(
    @InjectQueue('audio') private audioQueue: Queue,
    private readonly logService: LogService,
  ) {}
  private async downloadPDF(doc_url: string): Promise<ArrayBuffer> {
    try {
      const response = await fetch(doc_url);
      if (!response.ok) {
        this.logService.info(`Failed to fetch PDF: ${response.statusText}`, {
          status: response.statusText,
          doc_url: doc_url,
        });
      }

      return await response.arrayBuffer();
    } catch (error) {
      this.logService.error(`Error downloading PDF from URL: ${doc_url}`, {
        status: 'error',
        error: error.message,
        doc_url: doc_url,
      });
    }
  }

  async loadPDF(doc_url: string): Promise<Document<Record<string, any>>[]> {
    try {
      const arrayBuffer = await this.downloadPDF(doc_url);
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });

      const loader = new PDFLoader(blob, { splitPages: true });
      const pages = await loader.load();

      this.logService.info(`Successfully loaded PDF.`, {
        status: 'sucess',
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

  async splitDocument(
    pages: Document<Record<string, any>>[],
    chunk_size: number,
    chunk_overlap: number,
  ): Promise<Document<Record<string, any>>[]> {
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
}
