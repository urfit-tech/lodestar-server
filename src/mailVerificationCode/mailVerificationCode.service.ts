import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { digitalCodeGenerator, getBrowserByUserAgent } from '~/utils';
import { MailVerificationCodeInfrastructure } from './mailVerificationCode.infra';
import { EntityManager } from 'typeorm';
import { EmailService } from '~/mailer/email/email.service';
import { AppCache } from '~/app/app.type';
import { AppService } from '~/app/app.service';
import { DeviceInfrastructure } from '~/auth/device/device.infra';
@Injectable()
export default class MailVerificationCodeService {
  constructor(
    private readonly mailVerificationCodeInfra: MailVerificationCodeInfrastructure,
    private readonly memberDeviceInfra: DeviceInfrastructure,
    private readonly emailService: EmailService,
    private readonly appService: AppService,
    @InjectEntityManager() private entityManager: EntityManager,
  ) {}

  async checkMailVerificationCodeExpired(
    appId: string,
    email: string,
    type: string,
    code: string,
    expirationTimeMs: number,
  ): Promise<boolean> {
    const result = await this.mailVerificationCodeInfra.getMailVerificationCode(
      appId,
      email,
      type,
      code,
      this.entityManager,
    );
    return new Date(result.expiredAt).getTime() - new Date().getTime() < expirationTimeMs;
  }

  async verifyMailVerificationCode(appId: string, email: string, memberId: string, type: string, code: string) {
    try {
      const expirationTimeMs = 1000 * 60 * 30;
      const isVerify = await this.checkMailVerificationCodeExpired(appId, email, type, code, expirationTimeMs);
      if (isVerify) {
        const memberDevices = await this.memberDeviceInfra.getMemberDevices(memberId, this.entityManager);
        const oldestMemberDeviceId = memberDevices.reduce((prev, curr) => {
          return new Date(curr.createdAt) < new Date(prev.createdAt) ? curr : prev;
        }).id;
        await this.memberDeviceInfra.deleteMemberDeviceById(oldestMemberDeviceId, this.entityManager);
        const unexpiredMailVerificationCodes =
          await this.mailVerificationCodeInfra.getUnexpiredMailVerificationCodesByEmail(
            appId,
            email,
            type,
            this.entityManager,
          );
        const unexpiredMailVerificationCodeIds = unexpiredMailVerificationCodes.map(
          (unexpiredMailVerificationCode) => unexpiredMailVerificationCode.id,
        );
        await this.mailVerificationCodeInfra.updateMailVerificationCodesToNow(
          unexpiredMailVerificationCodeIds,
          appId,
          email,
          type,
          this.entityManager,
        );
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error(`Failed to verify the code,appId: ${appId},email:${email},type: ${type},error: ${error}`);
    }
  }

  async expireOldVerificationCodesByEmail(appId: string, email: string, type: string): Promise<void> {
    try {
      const verificationCodes = await this.mailVerificationCodeInfra.getUnexpiredMailVerificationCodesByEmail(
        appId,
        email,
        type,
        this.entityManager,
      );
      const ids = verificationCodes.map((verificationCode) => verificationCode.id);
      await this.mailVerificationCodeInfra.updateMailVerificationCodesToNow(
        ids,
        appId,
        email,
        type,
        this.entityManager,
      );
    } catch (error) {
      console.error();
    }
  }

  async expireOldAndSendVerificationCode(
    appId: string,
    email: string,
    type: string,
    userAgent: string,
    ip: string | null,
  ): Promise<void> {
    let code: string;
    let app: AppCache;
    const expirationTimeMs = 1000 * 60 * 30;
    try {
      code = digitalCodeGenerator(4);
      const mailVerificationCodes = await this.mailVerificationCodeInfra.getUnexpiredMailVerificationCodesByEmail(
        appId,
        email,
        type,
        this.entityManager,
      );
      const mailVerificationCodeIds = mailVerificationCodes.map((mailVerificationCode) => mailVerificationCode.id);
      await this.mailVerificationCodeInfra.updateMailVerificationCodesToNow(
        mailVerificationCodeIds,
        appId,
        email,
        type,
        this.entityManager,
      );
      // The new verification code must not be the same as an unexpired verification code.
      while (mailVerificationCodes.find((mailVerificationCode) => mailVerificationCode.code === code)) {
        code = digitalCodeGenerator(4);
        if (!mailVerificationCodes.find((mailVerificationCode) => mailVerificationCode.code === code)) {
          break;
        }
      }
      await this.mailVerificationCodeInfra.insertVerificationCode(
        appId,
        email,
        type,
        code,
        expirationTimeMs,
        this.entityManager,
      );

      app = await this.appService.getAppInfo(appId);
      await this.putEmailQueue(
        appId,
        'login-device-alert',
        email,
        {
          browser: getBrowserByUserAgent(userAgent),
          IP: ip || null,
          code,
          appName: app.name,
        },
        `[${app.name}] 新裝置登入通知`,
        this.entityManager,
      );
    } catch (error) {
      console.error(`Check and upsert verification code failed,appId:${appId},email:${email}, error:${error}`);
    }
  }

  private async putEmailQueue(
    appId: string,
    catalog: string,
    email: string,
    partials: Record<string, string>,
    subject: string,
    manager: EntityManager,
  ): Promise<void> {
    await this.emailService.insertEmailJobIntoQueue({
      appId,
      catalog,
      targetMemberIds: [email],
      partials,
      subject,
      manager,
    });
  }
}
