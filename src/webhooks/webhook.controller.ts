import { Body, Controller, Get, HttpException, HttpStatus, Post, ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { APIException } from '~/api.excetion';
import { WebhookTriggerDto } from './webhook.dto';
import { WebhookService } from './webhook.service';

@Controller({
  path: 'webhooks',
  version: '2',
})
export class WebhookController {
  constructor(private readonly webhookService: WebhookService, private readonly logger: Logger) {}

  @Post('/trigger')
  async handleWebhookTrigger(@Body(new ValidationPipe()) payload: WebhookTriggerDto) {
    const { event, data, appId } = payload;
    this.logger.log(`Trigger webhook: event=${event}, appId=${appId}`);

    try {
      const job = await this.webhookService.enqueueWebhook(event, data, appId);
      if (!job) {
        throw new APIException({
          code: 'E_NO_JOB',
          message: `Failed to enqueue webhook job for event="${event}" appId="${appId}"`,
          result: '',
        });
      }
      return { code: 'SUCCESS', message: 'Webhook job queued', result: { jobId: job.id } };
    } catch (error) {
      this.logger.error('Queue webhook failed', error);
      throw new HttpException(
        {
          code: 'E_SEND_WEBHOOK',
          message: 'Queue webhook failed',
          result: error,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
