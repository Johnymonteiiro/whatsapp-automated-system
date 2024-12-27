import { PrismaConfigService } from 'src/infra/repositories/prisma/config/prisma_config.service';

interface GetConfigCaseResponse {
  config: {
    prompt_template: string;
    max_tokens: number;
    temperature: number;
    gpt_model: string;
    embedding_model: string;
  };
}

export class GetConfigUseCase {
  constructor(private configRepository: PrismaConfigService) {}

  async execute(): Promise<GetConfigCaseResponse> {
    const response = await this.configRepository.findAll();
    const config = response[0];
    return { config };
  }
}
