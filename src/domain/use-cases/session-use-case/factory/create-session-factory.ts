import { CreateSessionUseCase } from 'src/domain/use-cases/session-use-case/create-session-use-case';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { PrismaSessionService } from 'src/infra/repositories/prisma/session/prisma_session.service';

export function MakeCreateSessionUseCase() {
  const sessionRepository = new PrismaSessionService(new PrismaService()); // instance the repository
  const storeSessionUseCase = new CreateSessionUseCase(sessionRepository); // instance the users use-case class

  return storeSessionUseCase;
}
