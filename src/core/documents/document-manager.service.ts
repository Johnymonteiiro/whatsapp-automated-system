import { QdrantVectorStore } from '@langchain/qdrant';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { MakeDocUseCase } from 'src/domain/use-cases/doc-use-case/factory/get-doc-factory';
import { AIService } from 'src/infra/lib/openAI/openai.service';
import { VectorStoreService } from 'src/infra/lib/qdrant/qdrant.service';
import { LogService } from 'src/infra/logs/logs.service';
import { DocumentProcessingService } from './documents.service';

@Injectable()
export class DocumentManagerService implements OnModuleInit {
  constructor(
    private readonly documentProcessingService: DocumentProcessingService,
    private readonly vectorStoreService: VectorStoreService,
    private readonly aiService: AIService,
    private readonly logService: LogService,
  ) {}

  async startProcessing() {
    const getDocs = MakeDocUseCase();
    const { docs } = await getDocs.execute();
    await this.processDocuments(docs, 5);
  }

  async processDocuments(
    docs: {
      doc_name: string;
      collection_name: string;
      chunk_size: number;
      chunk_overlap: number;
      doc_link: string;
    }[],
    batchSize = 10,
  ): Promise<void> {
    try {
      this.logService.addLog(
        'info',
        `Total documents to process: ${docs.length}`,
      );

      for (let i = 0; i < docs.length; i += batchSize) {
        const batch = docs.slice(i, i + batchSize);

        this.logService.addLog(
          'info',
          `Processing batch ${i / batchSize + 1}: ${batch.length} documents`,
        );

        await Promise.all(
          batch.map(async (doc) => {
            try {
              const {
                doc_name,
                doc_link,
                collection_name,
                chunk_size,
                chunk_overlap,
              } = doc;

              this.logService.addLog(
                'info',
                `Processing document: ${doc_name}`,
              );

              const pages =
                await this.documentProcessingService.loadPDF(doc_link);
              const documentChunks =
                await this.documentProcessingService.splitDocument(
                  pages,
                  chunk_size,
                  chunk_overlap,
                );

              this.logService.addLog(
                'info',
                `Successfully loaded PDF: ${doc_name}`,
                {
                  chunks: pages.length,
                },
              );
              this.logService.addLog(
                'info',
                `Document split into ${documentChunks.length} chunks`,
                {
                  chunks: documentChunks.map((chunk) =>
                    chunk.pageContent.slice(0, 50),
                  ),
                },
              );
              await this.vectorStoreService.store_data(
                documentChunks,
                collection_name,
              );

              this.logService.addLog(
                'info',
                `Document ${doc_name} processed and stored in collection ${collection_name}`,
              );
            } catch (error) {
              this.logService.addLog(
                'error',
                `Failed to process document: ${doc.doc_name}`,
                error,
              );
            }
          }),
        );
      }

      this.logService.addLog('info', 'All documents processed successfully.');
    } catch (error) {
      this.logService.addLog('error', 'Error processing documents', error);
      throw error;
    }
  }

  async get_retrieve_store(
    collection_name: string,
  ): Promise<QdrantVectorStore> {
    const vectorStore = await QdrantVectorStore.fromExistingCollection(
      this.aiService.getEmbeddingsModel(),
      {
        url: process.env.QDRANT_URL,
        collectionName: collection_name,
        apiKey: process.env.QDRANT_API_KEY,
      },
    );

    return vectorStore;
  }

  async onModuleInit() {
    await this.startProcessing();
  }
}
