import { ChatPromptTemplate } from '@langchain/core/prompts';
import { ChatOpenAI, ChatOpenAICallOptions } from '@langchain/openai';
import { Injectable } from '@nestjs/common';
import { createStuffDocumentsChain } from 'langchain/chains/combine_documents';
import { createRetrievalChain } from 'langchain/chains/retrieval';
import { EnsembleRetriever } from 'langchain/retrievers/ensemble';
import { AIService } from 'src/infra/lib/openAI/openai.service';
import { PrismaConfigService } from 'src/infra/repositories/prisma/config/prisma_config.service';
import { PrismaDocService } from 'src/infra/repositories/prisma/doc/prisma_doc.service';
import { VectorStoreService } from 'src/infra/lib/qdrant/qdrant.service';
import { LogService } from 'src/infra/logs/logs.service';
import { parallelTasks } from 'src/infra/util/parallel-tasks';
// import { CacheService } from 'src/infra/cache/cache.service';

@Injectable()
export class AssistantCoreService {
  private retriever: EnsembleRetriever | null = null;
  private prebuiltPrompt: ChatPromptTemplate | null = null;
  private llm: ChatOpenAI<ChatOpenAICallOptions> | null = null;

  constructor(
    private readonly aiService: AIService,
    private readonly prismaConfigService: PrismaConfigService,
    private readonly prismaDocService: PrismaDocService,
    private readonly vectorStoreService: VectorStoreService,
    private readonly logService: LogService,
    // private readonly cacheService: CacheService,
  ) {}

  async initializeCoreAssistant(): Promise<void> {
    try {
      const [config, docs, aiConfig] = await Promise.all([
        this.prismaConfigService.findAll(),
        this.prismaDocService.findAll(),
        this.aiService.configAI(),
      ]);

      if (!config || config.length === 0) {
        this.logService.warn('Configuration data is missing.', {
          status: 'warning',
          confing_info: config,
        });
      }

      if (!docs || docs.length === 0) {
        this.logService.warn('Document data is missing.', {
          status: 'warning',
          docs_info: docs,
        });
      }

      this.llm = aiConfig?.llm_model;
      const prompt_template = config[0]?.prompt_template ?? 'default_template';

      const collections = docs.map((doc) => doc.collection_name);
      this.retriever = await this.initializeRetriever(collections);

      this.prebuiltPrompt = ChatPromptTemplate.fromMessages([
        [
          'system',
          `${prompt_template}
             \n\n{context} 
             You must strictly adhere to the provided context when generating responses.
             Do not provide information, suggestions, or engage in discussions beyond the given context.
              If the context does not address the user's query, 
              politely indicate that the requested information is not 
              available.`,
        ],
        ['human', '{input}'],
      ]);

      this.logService.info('Core Assistant initialized successfully.', {
        status: 'success',
      });
    } catch (error) {
      this.logService.warn('Error initializing Core Assistant.', {
        status: 'warning',
        error: error.message,
      });
    }
  }

  private async initializeRetriever(
    collections: string[],
  ): Promise<EnsembleRetriever> {
    try {
      const vectorStores = await parallelTasks(
        collections.map(
          (collection) => () =>
            this.vectorStoreService.getVectorStore(collection),
        ),
        5, // Limite de concorrência ou tasks em simultaneo
      );

      const relevant_doc_response = (
        await this.prismaConfigService.findGeneralConfig()
      )?.relevant_doc_limit;

      const relevant_doc = relevant_doc_response ? relevant_doc_response : 3;

      const retrievers = vectorStores.map((store) =>
        store.asRetriever({ k: relevant_doc }),
      );

      return new EnsembleRetriever({
        retrievers,
        weights: retrievers.map(() => 1 / retrievers.length),
      });
    } catch (error) {
      this.logService.error('Error initializing retriever', {
        status: 'error',
        error: error.message,
      });
      return null;
    }
  }

  async retrieveContext(query: string): Promise<string | null> {
    if (!this.retriever) {
      this.logService.warn('Retriever is not initialized', {
        status: 'warning',
      });
      return null;
    }

    try {
      return this.retrieveCache(query);
    } catch (error) {
      this.logService.error('Error retrieving context.', {
        status: 'error',
        error: error.message,
      });
      return null;
    }
  }

  async generateResponse(query: string): Promise<string> {
    if (!this.llm) {
      this.logService.warn('LLM is not initialized.', {
        status: 'warning',
        llm_info: this.llm,
      });
      return 'O assistente não está configurado corretamente.';
    }

    try {
      const context = await this.retrieveContext(query);

      if (!context) {
        this.logService.warn('Context not found.', {
          status: 'warning',
          context_info: context,
        });
        return 'Desculpe, não encontrei informações relevantes.';
      }

      const prompt = this.prebuiltPrompt!;
      const questionAnswerChain = await createStuffDocumentsChain({
        llm: this.llm,
        prompt,
      });

      const chain = await createRetrievalChain({
        retriever: this.retriever!,
        combineDocsChain: questionAnswerChain,
      });

      const result = await chain.invoke({ input: query, context });
      return result.answer;
    } catch (error) {
      this.logService.error('Error generating response.', {
        status: 'error',
        error: error.message,
      });
      return 'Houve um problema ao gerar a resposta. Tente novamente.';
    }
  }

  private async retrieveCache(query: string): Promise<string | null> {
    // const cache_data = this.cacheService.get_data_cached<string>(query);
    // if (cache_data) {
    //   return cache_data;
    // }

    const documents = await this.retriever._getRelevantDocuments(query);

    if (!documents || documents.length === 0) {
      this.logService.info('No relevant documents found.', {
        relevants_docs: documents,
      });
      return null;
    }

    const content = documents
      .map((doc: any) => doc.pageContent || doc.content)
      .join('\\n\\n');

    // this.cacheService.store_data_cache<string>(query, content, 3000);
    return content;
  }
}
