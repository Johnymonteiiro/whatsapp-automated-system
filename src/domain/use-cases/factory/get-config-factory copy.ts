import { PrismaConfigRepository } from 'src/infra/repositories/prisma/config/prisma-config-repository';
import { GetConfigUseCase } from '../config-use-case/get-config-use-case copy';

export function MakeGetConfigUseCase() {
  const configRepository = new PrismaConfigRepository(); // instance the repository
  const getConfigUseCase = new GetConfigUseCase(configRepository); // instance the users use-case class
  return getConfigUseCase;
}
