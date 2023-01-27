import { Module } from '@nestjs/common'
import { ImporterTaskerService } from './importer-tasker/importer-tasker.service'
import { MailerTaskerService } from './mailer-tasker/mailer-tasker.service'
import { PaymentDebitorTaskerService } from './payment-debitor-tasker/payment-debitor-tasker.service'
import { WebhookTaskerService } from './webhook-tasker/webhook-tasker.service'

@Module({
  providers: [MailerTaskerService, PaymentDebitorTaskerService, WebhookTaskerService, ImporterTaskerService],
})
export class TaskerModule {}
