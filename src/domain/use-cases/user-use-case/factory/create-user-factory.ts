import { CreateUserUseCase } from 'src/domain/use-cases/User-use-case/create-User-use-case';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { PrismaUserService } from 'src/infra/repositories/prisma/user/prisma_user.service';

export function MakeCreateUserUseCase() {
  const UserRepository = new PrismaUserService(new PrismaService());
  const createUserUseCase = new CreateUserUseCase(UserRepository);

  return createUserUseCase;
}
