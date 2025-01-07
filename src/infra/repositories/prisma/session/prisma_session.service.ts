import { Injectable } from '@nestjs/common';
import { Prisma, Session } from '@prisma/client';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class PrismaSessionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.SessionUncheckedCreateInput): Promise<Session> {
    try {
      const session = await this.prisma.session.create({ data });
      return session;
    } catch (error) {
      console.error('Error creating session:', error);
      throw new Error('Could not create session.');
    }
  }

  async updateSession(
    data: Prisma.SessionUpdateInput,
    userId: string,
  ): Promise<Session> {
    try {
      const session = await this.prisma.session.update({
        where: { userId },
        data,
      });
      return session;
    } catch (error) {
      console.error(`Error updating session for user ${userId}:`, error);
      throw new Error('Could not update session.');
    }
  }

  async upsertSession(data: any, userId: string, id: string): Promise<Session> {
    try {
      const session = await this.prisma.session.upsert({
        where: { userId },
        create: {
          id,
          userId,
          auth_data: data,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expira em 7 dias
        },
        update: {
          auth_data: data,
          updatedAt: new Date(),
        },
      });
      return session;
    } catch (error) {
      console.error(`Error upserting session for user ${userId}:`, error);
      throw new Error('Could not upsert session.');
    }
  }

  async findOne(userId: string): Promise<Session | null> {
    try {
      const session = await this.prisma.session.findUnique({
        where: { userId },
      });
      return session;
    } catch (error) {
      console.error(`Error finding session for user`, error);
      throw new Error('Could not find session.');
    }
  }

  async delete(userId: string): Promise<void> {
    try {
      await this.prisma.session.delete({ where: { userId } });
    } catch (error) {
      console.error(`Error deleting session with ID ${userId}:`, error);
      throw new Error('Could not delete session.');
    }
  }
}
