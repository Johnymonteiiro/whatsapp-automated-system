import { Injectable } from '@nestjs/common';
import { AssistantCoreService } from './assistent-core.service';
import { LogService } from 'src/infra/logs/logs.service';

@Injectable()
export class AssistantService {
  constructor(
    private readonly assistantCoreService: AssistantCoreService,
    private readonly logService: LogService,
  ) {}
  async initAssistant() {
    try {
      await this.assistantCoreService.initializeCoreAssistant();
      const answer = await this.handleQuery('Como posso me cadastrar no PRAE?');
      console.log(answer);
    } catch (error) {
      this.logService.error('Erro ao inicializar o assistente', {
        status: 'error',
        error: error.message,
      });
    }
  }

  async handleQuery(query: string): Promise<string> {
    try {
      return await this.assistantCoreService.generateResponse(query);
    } catch (error) {
      this.logService.error('Erro ao processar consulta', {
        status: 'error',
        query: query,
        error: error.message,
      });
      return 'Ocorreu um erro ao tentar processar sua consulta. Por favor, tente novamente mais tarde.';
    }
  }
}
