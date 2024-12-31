import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class PrismaEnvironmentsService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.EnvironmentsCreateInput) {
    const environments = await this.prisma.environments.create({
      data,
    });
    return environments;
  }

  async getEnvironment() {
    const response = await this.prisma.environments.findMany();

    const environments = response.map((res) => {
      return {
        id: res.id,
        name: res.name,
        value: res.value,
      };
    });
    return environments;
  }

  async updateEnvironments(data: Prisma.EnvironmentsUpdateInput, id: string) {
    const environments = await this.prisma.environments.update({
      where: {
        id,
      },
      data,
    });

    return environments;
  }
}
