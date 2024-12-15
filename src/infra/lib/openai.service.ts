import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { Injectable } from '@nestjs/common';
import { MakeGetConfigUseCase } from 'src/domain/use-cases/factory/get-config-factory copy';

@Injectable()
export class AIService {
  constructor() {}
  async configAI() {
    const getConfig = MakeGetConfigUseCase();
    const { config } = await getConfig.execute();

    const llm_model = new ChatOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      model: config?.gpt_model,
      maxTokens: config?.max_tokens,
    });

    const embeddings_model = new OpenAIEmbeddings({
      apiKey: process.env.OPENAI_API_KEY,
      model: config?.embedding_model,
    });

    return { llm_model, embeddings_model };
  }
}
