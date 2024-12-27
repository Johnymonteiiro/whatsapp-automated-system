import { Session } from '@prisma/client';
import { PrismaSessionService } from 'src/infra/repositories/prisma/session/prisma_session.service';

interface GetSessionCaseResponse {
  sessions: Session;
}

export class GetMySessionsUseCase {
  constructor(private sessionRepository: PrismaSessionService) {}

  async execute(userId: string): Promise<GetSessionCaseResponse> {
    const sessions = await this.sessionRepository.findOne(userId);
    return { sessions };
  }
}
