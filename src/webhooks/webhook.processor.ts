import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import axios from 'axios';
import { Logger } from 'nestjs-pino';

@Processor('webhook')
export class WebhookProcessor {
  constructor(private readonly logger: Logger) {}
  @Process('send')
  async handleSend(job: Job<{ url: string; event: string; data: any }>) {
    const { url, event, data } = job.data;
    this.logger.log(`Sending webhook to ${url} for event ${event}`);
    try {
      await axios.post(url, data);
    } catch (err) {
      this.logger.error(`Failed to sending webhook to ${url} for event ${event},error:${err}`);
      throw err;
    }
  }
}
