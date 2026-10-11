import { Headers, Post, Body, Logger, Controller } from '@nestjs/common';
import { AppCache } from '~/app/app.type';
import { APIException } from '~/api.excetion';
import { Local } from '~/decorator';
import MailVerificationCodeService from './mailVerificationCode.service';
import { SendMailVerificationCodeDTO, VerifyMailVerificationCodeDTO } from './mailVerificationCode.dto';

const assertRequestApp = (appCache: AppCache | undefined, appId: string) => {
  // codes are only sent and checked through the member's own app host
  if (!appCache?.id || appId !== appCache.id) {
    throw new APIException({ code: 'E_APP_MISMATCH', message: 'app mismatch', result: null }, 403);
  }
  return appCache.id;
};

@Controller({
  path: 'mail-verification-code',
  version: '2',
})
export class MailVerificationCodeController {
  constructor(
    private readonly mailVerificationCodeService: MailVerificationCodeService,
    private readonly logger: Logger,
  ) {}

  @Post('verify')
  async verifyMailVerificationCode(
    @Local('appCache') appCache: AppCache | undefined,
    @Body() body: VerifyMailVerificationCodeDTO,
  ) {
    const { email, memberId, type, code } = body;
    const appId = assertRequestApp(appCache, body.appId);
    try {
      const verified = await this.mailVerificationCodeService.verifyDeviceBindCode(appId, email, memberId, type, code);
      if (!verified) {
        return {
          code: 'E_VERIFICATION_FAILED',
          message: 'Verification failed.',
          result: null,
        };
      }
      await this.mailVerificationCodeService.expireOldVerificationCodesByEmail(appId, email, type);
      return {
        code: 'SUCCESS',
        message: 'Verification code validated successfully',
        result: null,
      };
    } catch (error) {
      this.logger.error(`verify mail verification code failed. appId: ${appId}, error: ${error?.message}`);
      return { code: 'E_VERIFICATION_FAILED', message: 'Verification failed.', result: null };
    }
  }

  @Post('send')
  async mailVerificationCode(
    @Local('appCache') appCache: AppCache | undefined,
    @Headers('User-Agent') userAgent: string | undefined,
    @Body() body: SendMailVerificationCodeDTO,
  ) {
    const { email, type, ip } = body;
    const appId = assertRequestApp(appCache, body.appId);
    try {
      // the same response whether or not a mail was sent
      await this.mailVerificationCodeService.sendDeviceBindCode(appId, email, type, userAgent, ip);
    } catch (error) {
      this.logger.error(`send mail verification code failed. appId: ${appId}, error: ${error?.message}`);
    }
    return {
      code: 'SUCCESS',
      message: 'Sent verification email successfully',
      result: null,
    };
  }
}
