import { Module } from '@nestjs/common';
import { LeadModule } from './meta/lead.module';

@Module({
  imports: [LeadModule],
})
export class WebhookModule {}
