import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { PrismaConfigService } from 'src/infra/repositories/prisma/config/prisma_config.service';
import { GetConfigUseCase } from '../get-config-use-case';

export function MakeGetConfigUseCase() {
  const configRepository = new PrismaConfigService(new PrismaService()); // instance the repository
  const getConfigUseCase = new GetConfigUseCase(configRepository); // instance the users use-case class
  return getConfigUseCase;
}
