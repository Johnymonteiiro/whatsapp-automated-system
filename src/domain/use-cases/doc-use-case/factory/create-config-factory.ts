import { PrismaDocRepository } from 'src/infra/repositories/prisma/Doc/prisma-Doc-repository';
import { CreateDocUseCase } from '../create-doc-config-use-case';

export function MakeCreateDocUseCase() {
  const DocRepository = new PrismaDocRepository(); // instance the repository
  const createDocUseCase = new CreateDocUseCase(DocRepository); // instance the users use-case class

  return createDocUseCase;
}
