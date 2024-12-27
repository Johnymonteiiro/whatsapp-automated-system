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
        console.warn('Configurações não encontradas. Usando valores padrão.');
      }

      if (!process.env.OPENAI_API_KEY) {
        console.warn(
          'A chave da API OpenAI (OPENAI_API_KEY) não foi configurada. O serviço de IA ficará desabilitado.',
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
        console.warn(
          `Modelo GPT inválido: ${config.gpt_model}. Usando valores padrão.`,
        );
        return;
      }

      if (typeof config.max_tokens !== 'number' || config.max_tokens <= 0) {
        console.warn(
          'O valor de max_tokens deve ser um número maior que zero. Usando valor padrão.',
        );
        return;
      }

      if (
        typeof config.temperature !== 'number' ||
        config.temperature < 0 ||
        config.temperature > 1
      ) {
        console.warn(
          'O valor de temperature deve estar entre 0 e 1. Usando valor padrão.',
        );
        return;
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
        console.warn(
          `Modelo de embedding inválido: ${config.embedding_model}. Usando valores padrão.`,
        );
        return;
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
      // Log the error but do not rethrow it to avoid interrupting the application.
    }
  }

  getLLMModel(): ChatOpenAI | null {
    if (!this.llm_model) {
      console.warn('O modelo LLM não foi configurado.');
      return null;
    }
    return this.llm_model;
  }

  getEmbeddingsModel(): OpenAIEmbeddings | null {
    if (!this.embeddings_model) {
      console.warn('O modelo de embeddings não foi configurado.');
      return null;
    }
    return this.embeddings_model;
  }
}
