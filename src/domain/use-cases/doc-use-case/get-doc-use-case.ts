import { Document } from '@prisma/client';
import { PrismaDocService } from 'src/infra/repositories/prisma/doc/prisma_doc.service';

interface GetDocCaseResponse {
  docs: Document[];
}

export class GetDocUseCase {
  constructor(private DocRepository: PrismaDocService) {}

  async execute(): Promise<GetDocCaseResponse> {
    const docs = await this.DocRepository.findAll();
    return { docs };
  }
}
