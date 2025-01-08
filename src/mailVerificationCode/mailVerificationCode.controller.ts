import { Headers, Post, Body, Logger, Controller, BadRequestException } from '@nestjs/common';
import MailVerificationCodeService from './mailVerificationCode.service';
import { SendMailVerificationCodeDTO, VerifyMailVerificationCodeDTO } from './mailVerificationCode.dto';
import { EventType } from './mailVerificationCode.type';

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
  async verifyMailVerificationCode(@Body() body: VerifyMailVerificationCodeDTO) {
    const { appId, email, memberId, type, code } = body;
    if (!Object.values(EventType).includes(type as EventType)) {
      throw new BadRequestException(
        `verifyMailVerificationCode failed. appId:${appId},email:${email}, invalid type: ${type}`,
      );
    }
    try {
      const result = await this.mailVerificationCodeService.verifyMailVerificationCode(
        appId,
        email,
        memberId,
        type,
        code,
      );
      if (!result) {
        return {
          code: 'E_VERIFICATION_FAILED',
          message: `Verification failed. appId:${appId},email:${email}, type: ${type}, code:${code}`,
          result: null,
        };
      } else {
        await this.mailVerificationCodeService.expireOldVerificationCodesByEmail(appId, email, type);
        return {
          code: 'SUCCESS',
          message: 'Verification code validated successfully',
          result: null,
        };
      }
    } catch (error) {
      this.logger.error(`error: ${error}`);
      return { code: error.name, message: error.message };
    }
  }

  @Post('send')
  async mailVerificationCode(
    @Headers('User-Agent') userAgent: string | undefined,
    @Body() body: SendMailVerificationCodeDTO,
  ) {
    const { appId, email, type, ip } = body;
    try {
      await this.mailVerificationCodeService.expireOldAndSendVerificationCode(appId, email, type, userAgent, ip);
      return {
        code: 'SUCCESS',
        message: 'Sent verification email successfully',
        result: null,
      };
    } catch (error) {
      this.logger.error(`error: ${error}`);
      return { code: error.name, message: error.message };
    }
  }
}
