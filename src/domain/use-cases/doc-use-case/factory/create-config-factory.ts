import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { PrismaDocService } from 'src/infra/repositories/prisma/doc/prisma_doc.service';
import { CreateDocUseCase } from '../create-doc-use-case';

export function MakeCreateDocUseCase() {
  const DocRepository = new PrismaDocService(new PrismaService()); // instance the repository
  const createDocUseCase = new CreateDocUseCase(DocRepository); // instance the users use-case class

  return createDocUseCase;
}
