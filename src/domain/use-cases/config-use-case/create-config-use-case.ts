import { Configuration } from '@prisma/client';
import { ConfigDTO } from 'src/domain/dtos/config_ai.dto';
import { PrismaConfigRepository } from 'src/infra/repositories/prisma/config/prisma-config-repository';

interface CreateConfigCaseResponse {
  config: Configuration;
}

export class CreateConfigUseCase {
  constructor(private configRepository: PrismaConfigRepository) {}

  async execute({
    embedding_model,
    gpt_model,
    max_tokens,
    prompt_template,
    temperature,
  }: ConfigDTO): Promise<CreateConfigCaseResponse> {
    const config = await this.configRepository.create({
      embedding_model,
      gpt_model,
      max_tokens,
      prompt_template,
      temperature,
    });

    return { config };
  }
}
