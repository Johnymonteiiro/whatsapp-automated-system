import { Session } from '@prisma/client';
import { SessionDTO } from 'src/domain/dtos/session.dto';
import { PrismaSessionService } from 'src/infra/repositories/prisma/session/prisma_session.service';

interface CreateSessionCaseResponse {
  Session: Session;
}

export class CreateSessionUseCase {
  constructor(private sessionRepository: PrismaSessionService) {}

  async execute({
    auth_data,
    userId,
  }: SessionDTO): Promise<CreateSessionCaseResponse> {
    const Session = await this.sessionRepository.create({
      auth_data,
      userId,
    });

    return { Session };
  }
}
