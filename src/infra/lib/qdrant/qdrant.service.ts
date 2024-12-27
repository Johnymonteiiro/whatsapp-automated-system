import { QdrantVectorStore } from '@langchain/qdrant';
import { Injectable } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';
import { AIService } from '../openAI/openai.service';

@Injectable()
export class VectorStoreService {
  constructor(private readonly aiService: AIService) {}

  async store_data(docs: any[], collection_name: string): Promise<void> {
    if (!docs || !Array.isArray(docs) || docs.length === 0) {
      throw new Error(
        'Invalid documents array. Ensure docs is a non-empty array.',
      );
    }

    try {
      const { embeddings_model } = await this.aiService.configAI();

      const collectionExists = await this.collectionExist(collection_name);

      if (!collectionExists) {
        await QdrantVectorStore.fromDocuments(docs, embeddings_model, {
          url: process.env.QDRANT_URL,
          apiKey: process.env.QDRANT_API_KEY,
          collectionName: collection_name,
        });
      } else {
        const vectorStore = await QdrantVectorStore.fromExistingCollection(
          embeddings_model,
          {
            url: process.env.QDRANT_URL,
            collectionName: collection_name,
            apiKey: process.env.QDRANT_API_KEY,
          },
        );
        await vectorStore.addDocuments(docs);
      }
    } catch (error) {
      console.error(
        `Error storing documents in collection ${collection_name}:`,
        error,
      );
      throw error;
    }
  }

  async collectionExist(collection_name: string): Promise<boolean> {
    try {
      const client = new QdrantClient({
        url: process.env.QDRANT_URL,
        apiKey: process.env.QDRANT_API_KEY,
      });
      const response = await client.collectionExists(collection_name);
      return response.exists;
    } catch (error) {
      console.error(
        `Error checking if collection ${collection_name} exists:`,
        error,
      );
      throw error;
    }
  }
}
