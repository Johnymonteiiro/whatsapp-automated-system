import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class PrismaSessionService {
  constructor(private prisma: PrismaService) {}
  async create(data: Prisma.SessionUncheckedCreateInput) {
    const session = await this.prisma.session.create({
      data,
    });

    return session;
  }
  async updateSession(data: Prisma.SessionUpdateInput, userId: string) {
    const Session = await this.prisma.session.update({
      where: {
        userId,
      },
      data,
    });

    return Session;
  }

  async findOne(userId: string) {
    const session = await this.prisma.session.findUnique({
      where: {
        userId,
      },
    });

    return session;
  }
}
