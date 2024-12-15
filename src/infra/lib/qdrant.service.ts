import { Injectable } from '@nestjs/common';
import { QdrantVectorStore } from '@langchain/qdrant';
import { QdrantClient } from '@qdrant/js-client-rest';
import { AIService } from './openai.service';

@Injectable()
export class VectorStoreService {
  constructor(private readonly aiService: AIService) {}

  store_data = async (docs: any, collection_name: string) => {
    const { embeddings_model } = await this.aiService.configAI();

    QdrantVectorStore.fromDocuments(docs, embeddings_model, {
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
      collectionName: collection_name,
    });
  };

  collectionExist = async (collection_name: string) => {
    const client = new QdrantClient({
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
    });
    const response = await client.collectionExists(collection_name);
    return response.exists;
  };
}
