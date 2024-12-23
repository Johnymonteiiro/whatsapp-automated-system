import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { Injectable } from '@nestjs/common';
import { MakeGetConfigUseCase } from 'src/domain/use-cases/config-use-case/factory/get-config-factory';

@Injectable()
export class AIService {
  private llm_model: ChatOpenAI | null = null;
  private embeddings_model: OpenAIEmbeddings | null = null;

  async configAI() {
    try {
      const getConfig = MakeGetConfigUseCase();
      const { config } = await getConfig.execute();

      if (!config) {
        throw new Error('Configurações não encontradas.');
      }

      if (!process.env.OPENAI_API_KEY) {
        throw new Error(
          'A chave da API OpenAI (OPENAI_API_KEY) não foi configurada.',
        );
      }

      // Validar e configurar o modelo GPT
      if (
        ![
          'gpt-4o-mini',
          'gpt-4o-mini-2024-07-18',
          'gpt-3.5-turbo',
          'gpt-3.5-turbo-0125',
        ].includes(config.gpt_model)
      ) {
        throw new Error(`Modelo GPT inválido: ${config.gpt_model}`);
      }

      if (typeof config.max_tokens !== 'number' || config.max_tokens <= 0) {
        throw new Error(
          'O valor de max_tokens deve ser um número maior que zero.',
        );
      }

      if (
        typeof config.temperature !== 'number' ||
        config.temperature < 0 ||
        config.temperature > 1
      ) {
        throw new Error('O valor de temperature deve estar entre 0 e 1.');
      }

      // Configurar LLM
      this.llm_model = new ChatOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        model: config.gpt_model,
        maxTokens: config.max_tokens,
        temperature: config.temperature,
      });

      // Validar e configurar o modelo de embeddings
      if (
        ![
          'text-embedding-3-small',
          'text-embedding-3-large',
          'text-embedding-ada-002',
        ].includes(config.embedding_model)
      ) {
        throw new Error(
          `Modelo de embedding inválido: ${config.embedding_model}`,
        );
      }

      this.embeddings_model = new OpenAIEmbeddings({
        apiKey: process.env.OPENAI_API_KEY,
        model: config.embedding_model,
      });

      return {
        llm_model: this.llm_model,
        embeddings_model: this.embeddings_model,
      };
    } catch (error) {
      console.error('Erro ao configurar IA:', error.message);
      throw error;
    }
  }

  getLLMModel(): ChatOpenAI | null {
    if (!this.llm_model) {
      throw new Error('O modelo LLM não foi configurado.');
    }
    return this.llm_model;
  }

  getEmbeddingsModel(): OpenAIEmbeddings | null {
    if (!this.embeddings_model) {
      throw new Error('O modelo de embeddings não foi configurado.');
    }
    return this.embeddings_model;
  }
}
