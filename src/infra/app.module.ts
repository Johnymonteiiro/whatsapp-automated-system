import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AssistantModule } from 'src/core/assistent/assistent.module';
import { MessageModule } from 'src/core/message/message.module';
import { InfraModule } from './infra.module';
import { envSchema } from './env';

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: (env) => envSchema.parse(env),
      isGlobal: true,
    }),
    AssistantModule,
    MessageModule,
    InfraModule,
  ],
})
export class AppModule {}
