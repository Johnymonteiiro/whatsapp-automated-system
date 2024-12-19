import { Document } from '@prisma/client';
import { PrismaDocRepository } from 'src/infra/repositories/prisma/Doc/prisma-Doc-repository';

interface GetDocCaseResponse {
  docs: Document[];
}

export class GetDocUseCase {
  constructor(private DocRepository: PrismaDocRepository) {}

  async execute(): Promise<GetDocCaseResponse> {
    const docs = await this.DocRepository.findAll();
    return { docs };
  }
}
