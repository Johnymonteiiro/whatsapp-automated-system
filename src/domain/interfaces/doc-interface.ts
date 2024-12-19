import { Prisma, Document } from '@prisma/client';

export interface DocInterface {
  create(data: Prisma.DocumentCreateInput): Promise<Document>;
  updateDoc(data: Prisma.DocumentUpdateInput, id: string): Promise<Document>;
  findAll(): Promise<Document[]>;
  findOne(doc_name: string): Promise<Document>;
}
