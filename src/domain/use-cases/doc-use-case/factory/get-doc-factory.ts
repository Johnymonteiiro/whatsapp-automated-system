import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { PrismaDocService } from 'src/infra/repositories/prisma/doc/prisma_doc.service';
import { GetDocUseCase } from '../get-doc-use-case';

export function MakeDocUseCase() {
  const configRepository = new PrismaDocService(new PrismaService()); // instance the repository
  const getConfigUseCase = new GetDocUseCase(configRepository); // instance the users use-case class
  return getConfigUseCase;
}
