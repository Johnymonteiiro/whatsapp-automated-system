import { Document, Prisma } from '@prisma/client';
import { DocInterface } from 'src/domain/interfaces/doc-interface';
import { prisma } from 'src/infra/database/prisma/prisma';

export class PrismaDocRepository implements DocInterface {
  async create(data: Prisma.DocumentCreateInput) {
    const Doc = await prisma.document.create({
      data,
    });

    return Doc;
  }
  async updateDoc(data: Prisma.DocumentCreateInput, id: string) {
    const Doc = await prisma.document.update({
      where: {
        id,
      },
      data,
    });

    return Doc;
  }

  async findAll(): Promise<Document[]> {
    const docs = await prisma.document.findMany();
    return docs;
  }

  async findOne(doc_name: string) {
    const doc = await prisma.document.findUnique({
      where: {
        doc_name,
      },
    });
    return doc;
  }
}
