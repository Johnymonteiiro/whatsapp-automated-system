import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { QdrantVectorStore } from '@langchain/qdrant';
import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import { Document } from 'langchain/document';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { DocumentDTO } from 'src/domain/dtos/document.dto';
import { AIService } from 'src/infra/lib/openai.service';
import { VectorStoreService } from 'src/infra/lib/qdrant.service';

@Injectable()
export class RetrieveDataService {
  constructor(
    private readonly vectorService: VectorStoreService,
    private readonly aiService: AIService,
  ) {}

  async store({
    collection_name,
    file_name,
    chunk_overlap,
    chunk_size,
  }: DocumentDTO) {
    const document_chunk = await this.splitDocument(
      file_name,
      chunk_overlap,
      chunk_size,
    );
    this.vectorService.store_data(document_chunk, collection_name);
  }

  async loadPDF(doc_name: string): Promise<Document<Record<string, any>>[]> {
    const pdf_path = doc_name;

    if (!fs.existsSync(pdf_path)) {
      throw new Error(`PDF file not found at path: ${pdf_path}`);
    }

    const loader = new PDFLoader(pdf_path, { splitPages: true });
    const pages = await loader.load();

    return pages;
  }

  async splitDocument(
    doc_name: string,
    chunk_overlap: number,
    chunk_size: number,
  ): Promise<Document<Record<string, any>>[]> {
    const pages = await this.loadPDF(doc_name);
    const text_splitter = new RecursiveCharacterTextSplitter({
      chunkSize: chunk_size,
      chunkOverlap: chunk_overlap,
      lengthFunction: (text) => text.length,
    });

    const documents = pages.map(
      ({ pageContent }: { pageContent: string }) =>
        new Document({ pageContent }),
    );

    const chunks = await text_splitter.splitDocuments(documents);

    return chunks;
  }
  async get_data_vector_store(
    collection_name: string,
  ): Promise<QdrantVectorStore> {
    const { embeddings_model } = await this.aiService.configAI();
    const vectorStore = await QdrantVectorStore.fromExistingCollection(
      embeddings_model,
      {
        url: process.env.QDRANT_URL,
        collectionName: collection_name,
      },
    );

    return vectorStore;
  }
}
