import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';
import WebhookRepository from './webhook.repository';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly webhookRepository: WebhookRepository,
    @InjectEntityManager() private readonly entityManager: EntityManager,
    @InjectQueue('webhook') private readonly webhookQueue: Queue,
  ) {}
  async enqueueWebhook(event: string, data: Record<string, any>, appId: string) {
    this.logger.log(`Queueing webhook event="${event}" for appId="${appId}"`);
    const appWebhook = await this.webhookRepository.getAppWebhookByEventAndAppId(this.entityManager, event, appId);
    if (!appWebhook) return;
    const job = await this.webhookQueue.add('send', {
      url: appWebhook.url,
      event,
      data,
    });
    this.logger.log(`Webhook job queued: id=${job.id}, event=${event}, appId=${appId}`);
    return job;
  }
}
