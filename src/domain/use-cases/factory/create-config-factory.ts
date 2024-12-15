import { PrismaConfigRepository } from 'src/infra/repositories/prisma/config/prisma-config-repository';
import { CreateConfigUseCase } from '../config-use-case/create-config-use-case';

export function MakeCreateConfigUseCase() {
  const configRepository = new PrismaConfigRepository(); // instance the repository
  const createConfigUseCase = new CreateConfigUseCase(configRepository); // instance the users use-case class

  return createConfigUseCase;
}
