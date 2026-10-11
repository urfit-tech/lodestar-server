import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { digitalCodeGenerator, getBrowserByUserAgent } from '~/utils';
import { MailVerificationCodeInfrastructure } from './mailVerificationCode.infra';
import { EntityManager } from 'typeorm';
import { EmailService } from '~/mailer/email/email.service';
import { AppCache } from '~/app/app.type';
import { AppService } from '~/app/app.service';
import { DeviceInfrastructure } from '~/auth/device/device.infra';
import { CacheService } from '~/utility/cache/cache.service';
import {
  allowDeviceBindSend,
  authKeys,
  clearDeviceBindChallenge,
  decrementIfExists,
  incrementWithTtl,
  isDeviceBindLocked,
  LIMITS,
  readDeviceBindChallenge,
} from '~/auth/auth-limits';
import { EventType } from './mailVerificationCode.type';

@Injectable()
export default class MailVerificationCodeService {
  constructor(
    private readonly mailVerificationCodeInfra: MailVerificationCodeInfrastructure,
    private readonly memberDeviceInfra: DeviceInfrastructure,
    private readonly emailService: EmailService,
    private readonly appService: AppService,
    private readonly cacheService: CacheService,
    @InjectEntityManager() private entityManager: EntityManager,
  ) {}

  /**
   * Sends a device bind code only to a member who has just signed in and reached the bind limit (the device bind
   * challenge exists for this email), at most once per minute and five times per hour. Returns whether a mail was queued.
   */
  async sendDeviceBindCode(
    appId: string,
    email: string,
    type: string,
    userAgent: string,
    ip: string | null,
  ): Promise<boolean> {
    if (type !== EventType.BIND_DEVICE_LIMIT) {
      return false;
    }
    const redis = this.cacheService.getClient();
    const memberId = await readDeviceBindChallenge(redis, appId, email);
    if (!memberId || !(await allowDeviceBindSend(redis, appId, memberId))) {
      return false;
    }
    await this.expireOldAndSendVerificationCode(appId, email, type, userAgent, ip);
    return true;
  }

  /**
   * Checks a device bind code for the member who holds the device bind challenge of this email.
   * Wrong codes are counted per member (never reset by signing in); at the cap the challenge and the
   * outstanding codes are dropped. On success the oldest device is removed and the challenge is cleared.
   */
  async verifyDeviceBindCode(appId: string, email: string, memberId: string, type: string, code: string) {
    if (type !== EventType.BIND_DEVICE_LIMIT || !memberId) {
      return false;
    }
    const redis = this.cacheService.getClient();
    if (await isDeviceBindLocked(redis, appId, memberId)) {
      return false;
    }
    const challengeMemberId = await readDeviceBindChallenge(redis, appId, email);
    if (!challengeMemberId || challengeMemberId !== memberId) {
      return false;
    }

    // count this attempt before comparing so that concurrent requests cannot exceed the cap;
    // the count is given back when the code turns out to be correct
    const failKey = authKeys.deviceBindFail(appId, memberId);
    const [attempts] = await incrementWithTtl(redis, [{ key: failKey, ttlSeconds: LIMITS.deviceBindFail.ttlSeconds }]);
    if (attempts > LIMITS.deviceBindFail.cap) {
      return false;
    }

    const verified = await this.verifyMailVerificationCode(appId, email, memberId, type, code);
    if (verified) {
      await decrementIfExists(redis, failKey);
      await clearDeviceBindChallenge(redis, appId, email);
      return true;
    }

    if (attempts >= LIMITS.deviceBindFail.cap) {
      await clearDeviceBindChallenge(redis, appId, email);
      await this.expireOldVerificationCodesByEmail(appId, email, type);
    }
    return false;
  }

  async checkMailVerificationCodeExpired(
    appId: string,
    email: string,
    type: string,
    code: string,
    expirationTimeMs: number,
  ): Promise<boolean> {
    const result = await this.mailVerificationCodeInfra.getUnexpiredMailVerificationCodesByEmail(
      appId,
      email,
      type,
      this.entityManager,
    );
    if (result.length === 0) {
      return false;
    } else {
      const expiredAt = result.find(mailVerificationCode => mailVerificationCode.code === code)?.expiredAt;
      return new Date(expiredAt).getTime() - new Date().getTime() < expirationTimeMs;
    }
  }

  private async verifyMailVerificationCode(appId: string, email: string, memberId: string, type: string, code: string) {
    try {
      const expirationTimeMs = 1000 * 60 * 30;
      const isVerify = await this.checkMailVerificationCodeExpired(appId, email, type, code, expirationTimeMs);
      if (isVerify) {
        const memberDevices = await this.memberDeviceInfra.getMemberDevices(memberId, this.entityManager);
        const oldestMemberDeviceId = memberDevices.reduce(
          (prev, curr) => (new Date(curr.createdAt) < new Date(prev.createdAt) ? curr : prev),
          memberDevices[0],
        ).id;
        await this.memberDeviceInfra.deleteMemberDeviceById(oldestMemberDeviceId, this.entityManager);
        const unexpiredMailVerificationCodes =
          await this.mailVerificationCodeInfra.getUnexpiredMailVerificationCodesByEmail(
            appId,
            email,
            type,
            this.entityManager,
          );
        const unexpiredMailVerificationCodeIds = unexpiredMailVerificationCodes.map(
          unexpiredMailVerificationCode => unexpiredMailVerificationCode.id,
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
      console.error(`Failed to verify the code, appId: ${appId}, type: ${type}, error: ${error}`);
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
      const ids = verificationCodes.map(verificationCode => verificationCode.id);
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

  private async expireOldAndSendVerificationCode(
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
      const mailVerificationCodeIds = mailVerificationCodes.map(mailVerificationCode => mailVerificationCode.id);
      await this.mailVerificationCodeInfra.updateMailVerificationCodesToNow(
        mailVerificationCodeIds,
        appId,
        email,
        type,
        this.entityManager,
      );
      // The new verification code must not be the same as an unexpired verification code.
      while (mailVerificationCodes.find(mailVerificationCode => mailVerificationCode.code === code)) {
        code = digitalCodeGenerator(4);
        if (!mailVerificationCodes.find(mailVerificationCode => mailVerificationCode.code === code)) {
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
        type,
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
      console.error(`Check and upsert verification code failed, appId: ${appId}, error: ${error}`);
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
