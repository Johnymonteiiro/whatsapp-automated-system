import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { PrismaSessionService } from 'src/infra/repositories/prisma/session/prisma_session.service';
import { GetSessionsUseCase } from '../get-session-use-case';

export function MakeGetSessionUseCase() {
  const sessionRepository = new PrismaSessionService(new PrismaService()); // instance the repository
  const getSessionUseCase = new GetSessionsUseCase(sessionRepository); // instance the users use-case class

  return getSessionUseCase;
}
