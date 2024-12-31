import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
// import { CacheInterceptor, CacheModule } from '@nestjs/cache-manager';
import { AssistantModule } from 'src/core/assistent/assistent.module';
import { MessageModule } from 'src/core/message/message.module';
import { InfraModule } from './infra.module';
import { envSchema } from './env';
// import { APP_INTERCEPTOR } from '@nestjs/core';
import { BullModule } from '@nestjs/bull';
import { DocumentsModule } from 'src/core/documents/documents.module';

// const TimeExpiredCache = 60 * 2;

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: (env) => envSchema.parse(env),
      isGlobal: true,
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('QUEUE_HOST'),
          port: configService.get('QUEUE_PORT'),
        },
      }),
      inject: [ConfigService],
    }),
    // CacheModule.register({
    //   store: 'memory',
    //   ttl: TimeExpiredCache,
    //   isGlobal: true,
    // }),
    AssistantModule,
    MessageModule,
    InfraModule,
    DocumentsModule,
  ],
  providers: [
    // {
    //   provide: APP_INTERCEPTOR,
    //   useClass: CacheInterceptor,
    // },
  ],
})
export class AppModule {}
