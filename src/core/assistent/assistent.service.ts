import { Injectable, OnModuleInit } from '@nestjs/common';
import { AssistantCoreService } from './assistent-core.service';

@Injectable()
export class AssistantService implements OnModuleInit {
  constructor(private readonly assistantCoreService: AssistantCoreService) {}
  async onModuleInit() {
    try {
      await this.assistantCoreService.initializeCoreAssistant();
      // const answear = await this.handleQuery(
      //   'Como realizar o meu cadastro PRAE?',
      // );
      // console.log('IA Response:', answear);
    } catch (error) {
      console.error('Erro ao inicializar o assistente:', error.message);
      throw error;
    }
  }

  async handleQuery(query: string): Promise<string> {
    try {
      return await this.assistantCoreService.generateResponse(query);
    } catch (error) {
      console.error('Erro ao processar consulta:', error.message);
      return 'Ocorreu um erro ao tentar processar sua consulta. Por favor, tente novamente mais tarde.';
    }
  }
}
