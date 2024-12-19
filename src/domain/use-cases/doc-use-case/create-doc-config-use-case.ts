import { Document } from '@prisma/client';
import { DocumentDTO } from 'src/domain/dtos/document.dto';
import { PrismaDocRepository } from 'src/infra/repositories/prisma/Doc/prisma-Doc-repository';

interface CreateDocCaseResponse {
  Doc: Document;
}

export class CreateDocUseCase {
  constructor(private DocRepository: PrismaDocRepository) {}

  async execute({
    doc_name,
    doc_link,
    chunk_overlap,
    chunk_size,
    collection_name,
    limit,
  }: DocumentDTO): Promise<CreateDocCaseResponse> {
    const docNameExist = await this.DocRepository.findOne(doc_name);

    if (docNameExist) {
      throw new Error('Document name already exist');
    }

    const Doc = await this.DocRepository.create({
      doc_name,
      doc_link,
      chunk_overlap,
      chunk_size,
      collection_name,
      limit,
    });

    return { Doc };
  }
}
