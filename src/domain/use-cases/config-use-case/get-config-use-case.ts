import { PrismaConfigRepository } from 'src/infra/repositories/prisma/config/prisma-config-repository';

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
  constructor(private configRepository: PrismaConfigRepository) {}

  async execute(): Promise<GetConfigCaseResponse> {
    const response = await this.configRepository.findAll();
    const config = response[0];
    return { config };
  }
}
