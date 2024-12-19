import { Injectable } from '@nestjs/common';
import { AIService } from 'src/infra/lib/openai.service';
import { DocumentManagerService } from '../documents/document-manager.service';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { createStuffDocumentsChain } from 'langchain/chains/combine_documents';
import { createRetrievalChain } from 'langchain/chains/retrieval';
import { EnsembleRetriever } from 'langchain/retrievers/ensemble';
import { ChatOpenAI, ChatOpenAICallOptions } from '@langchain/openai';
import { MakeGetConfigUseCase } from 'src/domain/use-cases/config-use-case/factory/get-config-factory';
import { MakeDocUseCase } from 'src/domain/use-cases/doc-use-case/factory/get-doc-factory';

@Injectable()
export class AssistantCoreService {
  private retriever: EnsembleRetriever | null = null;
  private prompt_template: string | null = null;
  private llm: ChatOpenAI<ChatOpenAICallOptions> | null = null;
  private limit: number;

  constructor(
    private readonly aiService: AIService,
    private readonly documentManagerService: DocumentManagerService,
  ) {}

  async initializeCoreAssistant(): Promise<void> {
    await this.documentManagerService.startProcessing();

    const { llm_model } = await this.aiService.configAI();
    this.llm = llm_model;

    const getConfig = MakeGetConfigUseCase();
    const getDocs = MakeDocUseCase();
    const { config } = await getConfig.execute();
    const { docs } = await getDocs.execute();

    this.prompt_template = config.prompt_template;
    const collections = docs.map((doc) => doc.collection_name);

    this.retriever = await this.initializeRetriever(collections);
  }

  private async initializeRetriever(
    collections: string[],
  ): Promise<EnsembleRetriever> {
    const vectorStores = await Promise.all(
      collections.map((collection) =>
        this.documentManagerService.get_retrieve_store(collection),
      ),
    );

    const retrievers = vectorStores.map((store) => store.asRetriever({ k: 3 }));

    return new EnsembleRetriever({
      retrievers,
      weights: retrievers.map(() => 1 / retrievers.length),
    });
  }

  async retrieveContext(query: string): Promise<string | null> {
    if (!this.retriever) {
      throw new Error('Retriever não inicializado.');
    }

    const documents = await this.retriever._getRelevantDocuments(query);

    if (!documents || documents.length === 0) {
      return null;
    }

    return documents
      .map((doc: any) => doc.pageContent || doc.content)
      .join('\\n\\n');
  }

  async generateResponse(query: string): Promise<string> {
    if (!this.llm) {
      throw new Error('LLM não inicializado.');
    }

    const context = await this.retrieveContext(query);

    const prompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        `${this.prompt_template}
             \n\n{context} 
             You must strictly adhere to the provided context when generating responses.
             Do not provide information, suggestions, or engage in discussions beyond the given context.
              If the context does not address the user's query, 
              politely indicate that the requested information is not 
              available.`,
      ],
      ['human', '{input}'],
    ]);

    const questionAnswerChain = await createStuffDocumentsChain({
      llm: this.llm,
      prompt,
    });

    const chain = await createRetrievalChain({
      retriever: this.retriever!,
      combineDocsChain: questionAnswerChain,
    });

    if (!context) {
      return 'Desculpe, não encontrei informações relevantes.';
    }

    const result = await chain.invoke({ input: query, context });

    return result.answer || 'Não foi possível gerar uma resposta.';
  }

  getRelevantDocLimit(limit: number) {
    this.limit = limit ? limit : 3;
  }
}
