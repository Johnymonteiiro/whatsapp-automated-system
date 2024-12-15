import { Prisma, Configuration } from '@prisma/client';

export interface ConfigProps {
  prompt_template: string;
  max_tokens: number;
  temperature: number;
  gpt_model: string;
  embedding_model: string;
}

export interface ConfigInterface {
  create(data: Prisma.ConfigurationCreateInput): Promise<Configuration>;
  updateUser(
    data: Prisma.ConfigurationUpdateInput,
    id: string,
  ): Promise<Configuration>;
  findAll(): Promise<ConfigProps[]>;
}
