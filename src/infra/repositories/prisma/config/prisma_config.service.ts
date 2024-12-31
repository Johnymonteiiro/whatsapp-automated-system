import { Injectable } from '@nestjs/common';
import { GeneralDocConfig, Prisma } from '@prisma/client';
import { ConfigProps } from 'src/domain/interfaces/config-interface';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class PrismaConfigService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.ConfigurationCreateInput) {
    const config = await this.prisma.configuration.create({
      data,
    });

    return config;
  }

  async createGeneralConfig(data: Prisma.GeneralDocConfigCreateInput) {
    const general_config = await this.prisma.generalDocConfig.create({
      data,
    });

    return general_config;
  }

  async updateConfig(data: Prisma.ConfigurationUpdateInput, id: string) {
    const config = await this.prisma.configuration.update({
      where: {
        id,
      },
      data,
    });

    return config;
  }

  async updateGeneralConfig(
    data: Prisma.GeneralDocConfigUpdateInput,
    id: string,
  ) {
    const general_config = await this.prisma.generalDocConfig.update({
      where: {
        id,
      },
      data,
    });

    return general_config;
  }

  async findAll(): Promise<ConfigProps[]> {
    const response = await this.prisma.configuration.findMany();
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

  async findGeneralConfig(): Promise<GeneralDocConfig> {
    const general_config = await this.prisma.generalDocConfig.findMany();
    return general_config[0];
  }
}
