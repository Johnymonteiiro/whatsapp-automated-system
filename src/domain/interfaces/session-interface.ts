import { Prisma, Session } from '@prisma/client';

export interface SessionInterface {
  create(data: Prisma.SessionUncheckedCreateInput): Promise<Session>;
  updateSession(data: Prisma.SessionUpdateInput, id: string): Promise<Session>;
  findOne(userId: string): Promise<Session>;
}
