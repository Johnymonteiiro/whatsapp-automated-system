import { PrismaDocRepository } from 'src/infra/repositories/prisma/Doc/prisma-Doc-repository';
import { GetDocUseCase } from '../get-doc-use-case';

export function MakeDocUseCase() {
  const configRepository = new PrismaDocRepository(); // instance the repository
  const getConfigUseCase = new GetDocUseCase(configRepository); // instance the users use-case class
  return getConfigUseCase;
}
