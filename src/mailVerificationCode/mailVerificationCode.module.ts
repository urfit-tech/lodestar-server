import { Logger, Module } from '@nestjs/common';
import MailVerificationCodeService from './mailVerificationCode.service';
import { MailVerificationCodeInfrastructure } from './mailVerificationCode.infra';
import { EmailService } from '~/mailer/email/email.service';
import { AppModule } from '~/app/app.module';
import { BullModule } from '@nestjs/bull';
import DeviceService from '~/auth/device/device.service';
import { DeviceInfrastructure } from '~/auth/device/device.infra';
import { MemberInfrastructure } from '~/member/member.infra';
import { MailVerificationCodeController } from './mailVerificationCode.controller';

@Module({
  controllers: [MailVerificationCodeController],
  imports: [AppModule, BullModule.registerQueue({ name: 'mailer' })],
  providers: [
    Logger,
    MailVerificationCodeService,
    MailVerificationCodeInfrastructure,
    EmailService,
    DeviceService,
    MemberInfrastructure,
    DeviceInfrastructure,
  ],
  exports: [MailVerificationCodeService, MailVerificationCodeInfrastructure],
})
export class MailVerificationCodeModule {}
