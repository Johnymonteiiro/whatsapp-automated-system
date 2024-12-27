import { Module } from '@nestjs/common';
import { PrismaService } from './database/prisma/prisma.service';
import { SessionController } from './http/controllers/session.controller';
import { UserController } from './http/controllers/user.controller';
import { ConnectionService } from './lib/baileys/connection/connection.service';
import { LogService } from './logs/logs.service';
import { PrismaConfigService } from './repositories/prisma/config/prisma_config.service';
import { PrismaDocService } from './repositories/prisma/doc/prisma_doc.service';
import { PrismaSessionService } from './repositories/prisma/session/prisma_session.service';
import { PrismaUserService } from './repositories/prisma/user/prisma_user.service';
import { PrismaAuthState } from './lib/baileys/connection/prisma_auth.service';

@Module({
  controllers: [UserController, SessionController],
  providers: [
    ConnectionService,
    PrismaService,
    LogService,
    PrismaConfigService,
    PrismaDocService,
    PrismaSessionService,
    PrismaUserService,
    PrismaAuthState,
  ],
  exports: [
    ConnectionService,
    PrismaService,
    PrismaConfigService,
    PrismaDocService,
    PrismaSessionService,
    PrismaUserService,
    PrismaAuthState,
  ],
})
export class InfraModule {}
