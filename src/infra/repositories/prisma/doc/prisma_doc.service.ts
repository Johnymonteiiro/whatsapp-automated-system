import { Injectable } from '@nestjs/common';
import { Document, Prisma } from '@prisma/client';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class PrismaDocService {
  constructor(private prisma: PrismaService) {}
  async create(data: Prisma.DocumentCreateInput) {
    const doc = await this.prisma.document.create({
      data,
    });

    return doc;
  }
  async updateDoc(data: Prisma.DocumentCreateInput, id: string) {
    const Doc = await this.prisma.document.update({
      where: {
        id,
      },
      data,
    });

    return Doc;
  }

  async findAll(): Promise<Document[]> {
    const docs = await this.prisma.document.findMany();
    return docs;
  }

  async findOne(doc_name: string) {
    const doc = await this.prisma.document.findUnique({
      where: {
        doc_name,
      },
    });
    return doc;
  }
}
