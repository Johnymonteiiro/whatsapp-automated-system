import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { PrismaSessionService } from 'src/infra/repositories/prisma/session/prisma_session.service';
import { GetMySessionsUseCase } from '../get-my-sessions-use-case';

export function MakeGetMySessionUseCase() {
  const sessionRepository = new PrismaSessionService(new PrismaService()); // instance the repository
  const getSessionUseCase = new GetMySessionsUseCase(sessionRepository); // instance the users use-case class

  return getSessionUseCase;
}
