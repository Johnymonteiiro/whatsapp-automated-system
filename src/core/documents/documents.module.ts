import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
@Module({
  exports: [],
  imports: [
    BullModule.registerQueueAsync({
      name: 'documents_processor',
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('QUEUE_HOST'),
          port: configService.get('QUEUE_PORT'),
        },
      }),
      inject: [ConfigService],
    }),
  ],

  controllers: [],
  providers: [],
})
export class DocumentsModule {}
