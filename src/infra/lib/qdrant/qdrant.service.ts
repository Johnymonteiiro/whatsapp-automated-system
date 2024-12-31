import { QdrantVectorStore } from '@langchain/qdrant';
import { Injectable } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';
import { AIService } from '../openAI/openai.service';
import { PrismaEnvironmentsService } from 'src/infra/repositories/prisma/environments/prisma_env.service';
import { LogService } from 'src/infra/logs/logs.service';

@Injectable()
export class VectorStoreService {
  constructor(
    private readonly aiService: AIService,
    private readonly environmentsService: PrismaEnvironmentsService,
    private readonly logService: LogService,
  ) {}

  async store_data(docs: any[], collection_name: string): Promise<void> {
    try {
      const { QDRANT_URL, QDRANT_API_KEY } = await this.getQdrantConfig();

      const { embeddings_model } = await this.aiService.configAI();

      const collectionExists = await this.collectionExist(collection_name);

      if (!collectionExists) {
        await QdrantVectorStore.fromDocuments(docs, embeddings_model, {
          url: QDRANT_URL,
          apiKey: QDRANT_API_KEY,
          collectionName: collection_name,
        });

        this.logService.info(
          `Collection ${collection_name} created successfully.`,
          {
            collectionName: collection_name,
            status: 'ok',
          },
        );
      } else {
        this.logService.info(`Collection ${collection_name} already exists.`);
      }
    } catch (error) {
      this.logService.error(
        `Error storing documents in collection ${collection_name}`,
        new Error(error.message),
      );
    }
  }

  /**
   * Check if a collection exists in the vector store.
   * @param collection_name Name of the collection to check.
   */
  async collectionExist(collection_name: string): Promise<boolean> {
    try {
      const { QDRANT_URL, QDRANT_API_KEY } = await this.getQdrantConfig();

      const client = new QdrantClient({
        url: QDRANT_URL,
        apiKey: QDRANT_API_KEY,
      });

      const response = await client.collectionExists(collection_name);
      return response.exists;
    } catch (error) {
      this.logService.error(
        `${collection_name} already exist`,
        new Error(error.message),
      );
    }
  }

  async getVectorStore(collection_name: string): Promise<QdrantVectorStore> {
    try {
      const { QDRANT_URL, QDRANT_API_KEY } = await this.getQdrantConfig();

      const collectionExists = await this.collectionExist(collection_name);
      if (!collectionExists) {
        this.logService.error(`${collection_name} already exist`);
        return;
      }

      const embeddingsModel = this.aiService.getEmbeddingsModel();

      const vectorStore = await QdrantVectorStore.fromExistingCollection(
        embeddingsModel,
        {
          url: QDRANT_URL,
          collectionName: collection_name,
          apiKey: QDRANT_API_KEY,
        },
      );

      this.logService.info(
        `Successfully retrieved vector store for collection ${collection_name}.`,
        {
          status: 'ok',
        },
      );
      return vectorStore;
    } catch (error) {
      this.logService.error(
        `Error retrieving vector store for collection ${collection_name}`,
        new Error(error.message),
      );
    }
  }

  private async getQdrantConfig(): Promise<{
    QDRANT_URL: string;
    QDRANT_API_KEY: string;
  }> {
    const env = await this.environmentsService.getEnvironment();

    if (env.length <= 0) {
      this.logService.error(`Environment configuration is missing`, {
        status: 'error',
        env_info: env,
      });
    }

    const QDRANT_URL = env.find((item) => item.name === 'QDRANT_URL')?.value;
    const QDRANT_API_KEY = env.find(
      (item) => item.name === 'QDRANT_API_KEY',
    )?.value;

    if (!QDRANT_URL || !QDRANT_API_KEY) {
      this.logService.error(
        'Missing QDRANT_URL or QDRANT_API_KEY in the environment configuration.',
        {
          status: 'error',
          env_info: {
            qdrant_url: QDRANT_URL,
            qdrant_api_key: QDRANT_API_KEY,
          },
        },
      );
      throw new Error('QDRANT_URL or QDRANT_API_KEY is not set.');
    }

    return { QDRANT_URL, QDRANT_API_KEY };
  }
}
