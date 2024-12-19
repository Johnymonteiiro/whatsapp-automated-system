import { Injectable } from '@nestjs/common';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { Document } from 'langchain/document';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

@Injectable()
export class DocumentProcessingService {
  async loadPDF(doc_url: string): Promise<Document<Record<string, any>>[]> {
    try {
      const headResponse = await fetch(doc_url, { method: 'HEAD' });
      if (!headResponse.ok) {
        throw new Error(`Failed to fetch PDF: ${headResponse.statusText}`);
      }

      const response = await fetch(doc_url);

      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });

      const loader = new PDFLoader(blob, { splitPages: true });
      const pages = await loader.load();
      return pages;
    } catch (error) {
      console.error(`Error loading PDF from URL: ${doc_url}`, error);
      throw error;
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
      return chunks;
    } catch (error) {
      console.error('Error splitting document:', error);
      throw error;
    }
  }
}
