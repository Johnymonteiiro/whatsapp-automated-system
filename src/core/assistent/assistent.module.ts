import { Module } from '@nestjs/common';
import { CreateConfigUseCase } from 'src/domain/use-cases/config-use-case/create-config-use-case';
import { ConfigurationController } from 'src/infra/http/controllers/config.controller';
import { AIService } from 'src/infra/lib/openai.service';
import { VectorStoreService } from 'src/infra/lib/qdrant.service';
import { AssistantService } from './assistent.service';
import { RetrieveDataService } from './retrieve_data.service';

@Module({
  imports: [AssistantModule],
  exports: [AssistantModule],
  controllers: [ConfigurationController],
  providers: [
    AssistantService,
    RetrieveDataService,
    VectorStoreService,
    AIService,
    CreateConfigUseCase,
  ],
})
export class AssistantModule {}
