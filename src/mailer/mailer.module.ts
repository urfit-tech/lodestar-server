import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';

import { AppModule } from '~/app/app.module';

import { EmailService } from './email/email.service';
import { SmsService } from './sms/sms.service';

@Module({
  imports: [
    AppModule,
    // BullModule.registerQueue({ name: MailerTasker.name }),
    BullModule.registerQueue({ name: 'mailer' }),
  ],
  providers: [EmailService, SmsService],
  exports: [EmailService],
})
export class MailerModule {}
