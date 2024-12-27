import { Session } from '@prisma/client';
import { PrismaSessionService } from 'src/infra/repositories/prisma/session/prisma_session.service';

export interface GetSessionCaseResponse {
  session: Session;
}

export class GetSessionsUseCase {
  constructor(private sessionRepository: PrismaSessionService) {}

  async execute(userId: string): Promise<GetSessionCaseResponse> {
    const session = await this.sessionRepository.findOne(userId);
    return { session };
  }
}
