import { User } from '@prisma/client';
import { hash } from 'bcryptjs';
import { PrismaUserService } from 'src/infra/repositories/prisma/user/prisma_user.service';

interface CreateUserCaseRequest {
  name: string;
  email: string;
  password: string;
}

interface CreateUserCaseResponse {
  User: User;
}

export class CreateUserUseCase {
  constructor(private UserRepository: PrismaUserService) {}

  async execute({
    email,
    name,
    password,
  }: CreateUserCaseRequest): Promise<CreateUserCaseResponse> {
    const emailValidation = email.includes('@ufsc.br');
    const passwordHash = await hash(password, 6);

    if (!emailValidation) {
      throw new Error('Invalid email! Have to provide an institutional email');
    }

    const emailAlreadyExists = await this.UserRepository.findByEmail(email);

    if (emailAlreadyExists) {
      throw new Error('Email already exists');
    }

    const User = await this.UserRepository.create({
      email,
      name,
      password: passwordHash,
    });

    return { User };
  }
}
