import { Injectable, OnModuleInit } from '@nestjs/common';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { ChatOpenAI, ChatOpenAICallOptions } from '@langchain/openai';
import { createStuffDocumentsChain } from 'langchain/chains/combine_documents';
import { createRetrievalChain } from 'langchain/chains/retrieval';
import { EnsembleRetriever } from 'langchain/retrievers/ensemble';
import { AIService } from 'src/infra/lib/openAI/openai.service';
import { PrismaConfigService } from 'src/infra/repositories/prisma/config/prisma_config.service';
import { PrismaDocService } from 'src/infra/repositories/prisma/doc/prisma_doc.service';
import { VectorStoreService } from 'src/infra/lib/qdrant/qdrant.service';
import { LogService } from 'src/infra/logs/logs.service';
import { parallelTasks } from 'src/infra/util/parallel-tasks';

@Injectable()
export class AssistantCoreService implements OnModuleInit {
  private retriever: EnsembleRetriever | null = null;
  private llm: ChatOpenAI<ChatOpenAICallOptions> | null = null;
  private prebuiltPrompt: ChatPromptTemplate | null = null;

  constructor(
    private readonly aiService: AIService,
    private readonly prismaConfigService: PrismaConfigService,
    private readonly prismaDocService: PrismaDocService,
    private readonly vectorStoreService: VectorStoreService,
    private readonly logService: LogService,
  ) {}

  async onModuleInit() {
    try {
      const [config, docs, aiConfig] = await Promise.all([
        this.prismaConfigService.findAll(),
        this.prismaDocService.findAll(),
        this.aiService.configAI(),
      ]);

      if (!config.length || !docs.length) {
        this.logService.warn('Missing configuration or documents.', {
          config,
          docs,
        });
        return;
      }

      this.llm = aiConfig?.llm_model;
      const promptTemplate = config[0]?.prompt_template || 'default_template';
      this.prebuiltPrompt = this.createPrompt(promptTemplate);

      const collections = docs.map((doc) => doc.collection_name);
      this.retriever = await this.initializeRetriever(collections);

      this.logService.info('Assistant initialized successfully.');
    } catch (error) {
      this.logService.error('Error during initialization.', { error });
    }
  }

  private createPrompt(template: string): ChatPromptTemplate {
    return ChatPromptTemplate.fromMessages([
      [
        'system',
        `${template}
        {context}
        Adhere strictly to the context. If not addressed, indicate so politely.`,
      ],
      ['human', '{input}'],
    ]);
  }

  private async initializeRetriever(
    collections: string[],
  ): Promise<EnsembleRetriever | null> {
    try {
      const vectorStores = await parallelTasks(
        collections.map(
          (collection) => () =>
            this.vectorStoreService.getVectorStore(collection),
        ),
        5,
      );

      const relevantDocsLimit =
        (await this.prismaConfigService.findGeneralConfig())
          ?.relevant_doc_limit || 3;

      const retrievers = vectorStores.map((store) =>
        store.asRetriever({ k: relevantDocsLimit }),
      );

      return new EnsembleRetriever({
        retrievers,
        weights: Array(retrievers.length).fill(1 / retrievers.length),
      });
    } catch (error) {
      this.logService.error('Error initializing retriever.', { error });
      return null;
    }
  }

  private async retrieveContext(query: string): Promise<string | null> {
    if (!this.retriever) {
      this.logService.warn('Retriever is not initialized.');
      return null;
    }

    const documents = await this.retriever._getRelevantDocuments(query);
    if (!documents?.length) {
      this.logService.info('No relevant documents found.');
      return null;
    }

    return documents.map((doc) => doc.pageContent).join('\n\n');
  }

  private async generateResponse(
    query: string,
    context: string,
  ): Promise<string | null> {
    if (!this.llm || !this.prebuiltPrompt || !this.retriever) {
      this.logService.warn('LLM or retriever not initialized.');
      return null;
    }

    const questionAnswerChain = await createStuffDocumentsChain({
      llm: this.llm,
      prompt: this.prebuiltPrompt,
    });

    const chain = await createRetrievalChain({
      retriever: this.retriever,
      combineDocsChain: questionAnswerChain,
    });

    try {
      const resultStream = await chain.stream({ input: query, context });
      let answer = '';
      for await (const result of resultStream) {
        answer += result.answer;
      }
      return answer;
    } catch (error) {
      this.logService.error('Error generating response.', { error });
      return null;
    }
  }

  async handleQuery(query: string): Promise<string> {
    try {
      const context = await this.retrieveContext(query);
      if (!context) return 'No relevant information found.';

      const answer = await this.generateResponse(query, context);
      return answer || 'Unable to process your request.';
    } catch (error) {
      this.logService.error('Error handling query.', { query, error });
      return 'An error occurred while processing your request.';
    }
  }
}
