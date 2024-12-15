import { Injectable, OnModuleInit } from '@nestjs/common';
import { RetrieveDataService } from './retrieve_data.service';
import { MakeGetConfigUseCase } from 'src/domain/use-cases/factory/get-config-factory copy';

@Injectable()
export class AssistantService implements OnModuleInit {
  constructor(private readonly retrieveDataService: RetrieveDataService) {}

  async onModuleInit() {
    try {
      const getConfig = MakeGetConfigUseCase();
      const { config } = await getConfig.execute();
      const collectionName = 'ufsc_document';
      // const documentName = 'edital.pdf';
      const vectorStore =
        await this.retrieveDataService.get_data_vector_store(collectionName);

      if (!vectorStore) {
        console.log(
          `Vector store para a coleção '${collectionName}' não encontrado. Armazenando dados...`,
        );
        // await this.retrieveDataService.store(collectionName, documentName);
      } else {
        console.log(
          `Vector store para a coleção '${collectionName}' encontrado.`,
        );
      }

      const updatedVectorStore =
        vectorStore ||
        (await this.retrieveDataService.get_data_vector_store(collectionName));

      if (!updatedVectorStore) {
        console.error(
          `Erro: Falha ao acessar o vector store atualizado para '${collectionName}'.`,
        );
        return;
      }

      const retriever = vectorStore.asRetriever({
        k: 3,
      });

      console.log('prompt', config.prompt_template);

      const systemTemplate = [
        `${config?.prompt_template}`,
        `\n\n{context}`,
      ].join('');

      // const prompt = ChatPromptTemplate.fromMessages([
      //   ['system', systemTemplate],
      //   ['human', '{input}'],
      // ]);

      // const questionAnswerChain = await createStuffDocumentsChain({
      //   llm: llm_model,
      //   prompt,
      // });

      // const ragChain = await createRetrievalChain({
      //   retriever,
      //   combineDocsChain: questionAnswerChain,
      // });

      // const userInput = 'Qual é o prazo de envio dos cadastros?';
      // const results = await ragChain.invoke({
      //   input: userInput,
      //   context: await retriever._getRelevantDocuments(userInput),
      // });

      // if (results && results.answer) {
      //   console.log('AI RESPONSE:', results.answer);
      // } else {
      //   console.log(
      //     'AI RESPONSE: Não foi possível gerar uma resposta com base no contexto fornecido.',
      //   );
      // }
    } catch (error) {
      console.error('Erro ao inicializar o assistente:', error);
    }
  }
}
