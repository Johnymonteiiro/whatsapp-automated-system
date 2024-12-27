import { Prisma } from '@prisma/client';

export class SessionDTO {
  auth_data: Prisma.JsonNullValueInput | Prisma.InputJsonValue;
  userId: string;
}
