import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { WebhookService } from './webhook.service';
import { WebhookProcessor } from './webhook.processor';
import WebhookRepository from './webhook.repository';
import { WebhookController } from './webhook.controller';

@Module({
  controllers: [WebhookController],
  imports: [
    BullModule.registerQueue({
      name: 'webhook',
    }),
  ],
  providers: [WebhookService, WebhookProcessor, WebhookRepository],
  exports: [WebhookService],
})
export class WebhookModule {}
