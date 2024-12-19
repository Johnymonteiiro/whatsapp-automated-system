import { Prisma } from '@prisma/client';
import {
  ConfigInterface,
  ConfigProps,
} from 'src/domain/interfaces/config-interface';
import { prisma } from 'src/infra/database/prisma/prisma';

export class PrismaConfigRepository implements ConfigInterface {
  async create(data: Prisma.ConfigurationCreateInput) {
    const config = await prisma.configuration.create({
      data,
    });

    return config;
  }
  async updateConfig(data: Prisma.ConfigurationUpdateInput, id: string) {
    const config = await prisma.configuration.update({
      where: {
        id,
      },
      data,
    });

    return config;
  }

  async findAll(): Promise<ConfigProps[]> {
    const response = await prisma.configuration.findMany();
    const config = response.map((res) => {
      return {
        prompt_template: res.prompt_template,
        max_tokens: res.max_tokens,
        temperature: res.temperature,
        gpt_model: res.gpt_model,
        embedding_model: res.embedding_model,
      };
    });

    return config;
  }
}
