import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { PrismaConfigService } from 'src/infra/repositories/prisma/config/prisma_config.service';
import { CreateConfigUseCase } from '../create-config-use-case';

export function MakeCreateConfigUseCase() {
  const configRepository = new PrismaConfigService(new PrismaService()); // instance the repository
  const createConfigUseCase = new CreateConfigUseCase(configRepository); // instance the users use-case class

  return createConfigUseCase;
}
