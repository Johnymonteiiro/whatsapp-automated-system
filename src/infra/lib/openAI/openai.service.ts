import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { Injectable } from '@nestjs/common';
import { MakeGetConfigUseCase } from 'src/domain/use-cases/config-use-case/factory/get-config-factory';
import { LogService } from 'src/infra/logs/logs.service';
import { PrismaEnvironmentsService } from 'src/infra/repositories/prisma/environments/prisma_env.service';

@Injectable()
export class AIService {
  private llm_model: ChatOpenAI | null = null;
  private embeddings_model: OpenAIEmbeddings | null = null;

  constructor(
    private readonly environmentsService: PrismaEnvironmentsService,
    private readonly logService: LogService,
  ) {}

  async configAI() {
    try {
      const env = await this.environmentsService.getEnvironment();

      if (env.length <= 0) {
        this.logService.error(`Environment configuration is missing`, {
          status: 'error',
          env_info: env,
        });
        return;
      }

      const OPENAI_API_KEY = env.find(
        (env) => env.name === 'OPENAI_API_KEY',
      )?.value;

      const getConfig = MakeGetConfigUseCase();
      const { config } = await getConfig.execute();

      if (!config) {
        this.logService.warn('Configurações não encontradas.', {
          status: 'warning',
          config_info: config,
        });
      }

      if (!OPENAI_API_KEY) {
        this.logService.warn(
          'A chave da API OpenAI (OPENAI_API_KEY) não foi configurada. O serviço de IA ficará desabilitado.',
          {
            status: 'warning',
            OPENAI_API_KEY: OPENAI_API_KEY,
          },
        );

        return;
      }

      this.llm_model = new ChatOpenAI({
        apiKey: OPENAI_API_KEY,
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
        this.logService.warn(
          `Modelo de embedding inválido: ${config.embedding_model}.`,
          {
            status: 'warning',
            embedding_model: config.embedding_model,
          },
        );
        return;
      }

      this.embeddings_model = new OpenAIEmbeddings({
        apiKey: OPENAI_API_KEY,
        model: config.embedding_model,
      });

      return {
        llm_model: this.llm_model,
        embeddings_model: this.embeddings_model,
      };
    } catch (error) {
      this.logService.error('Erro ao configurar IA:', error.message);
    }
  }

  getLLMModel(): ChatOpenAI | null {
    if (!this.llm_model) {
      this.logService.warn('O modelo LLM não foi configurado.', {
        status: 'warning',
        model_info: this.llm_model,
      });
      return null;
    }
    return this.llm_model;
  }

  getEmbeddingsModel(): OpenAIEmbeddings | null {
    if (!this.embeddings_model) {
      this.logService.warn('O modelo de embeddings não foi configurado..', {
        status: 'warning',
        model_info: this.embeddings_model,
      });
      return null;
    }
    return this.embeddings_model;
  }
}
