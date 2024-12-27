import { Prisma, User } from '@prisma/client';

export interface UserInterface {
  create(data: Prisma.UserCreateInput): Promise<User>;
  updateUser(data: Prisma.UserUpdateInput, userId: string): Promise<User>;
  findAllUsers(): Promise<User[]>;
  findFirst(userId: string): Promise<User>;
  findByEmail(email: string): Promise<User>;
}
