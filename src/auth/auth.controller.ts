import { Request } from 'express';
import { Body, Controller, Headers, Logger, Post, Req, Session } from '@nestjs/common';

import { PublicMember } from '~/member/member.type';
import { AppCache } from '~/app/app.type';
import { Local } from '~/decorator';

import { AuthService } from './auth.service';
import { CrossServerTokenDTO, GenerateTmpPasswordDTO, GeneralLoginDTO, LoginStatus } from './auth.type';
import { LoginDeviceStatus } from './device/device.type';
import DeviceService from './device/device.service';

@Controller({
  path: 'auth',
  version: ['1', '2'],
})
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly deviceService: DeviceService,
    private readonly logger: Logger,
  ) {}

  @Post('general-login')
  async generalLogin(
    @Req() request: Request,
    @Local('appCache') appCache: AppCache,
    @Session() session: Record<string, any> | undefined,
    @Headers('User-Agent') userAgent: string | undefined,
    @Body() body: GeneralLoginDTO,
  ) {
    if (!session) {
      return { code: 'E_SESSION', message: 'cannot get session', result: null };
    }

    const { cookies } = request;
    const { appId, account, password } = body;
    const { modules: appModules } = appCache;
    const isBusinessModuleEnable = appModules.includes('business_member');
    const loggedInMembers: Array<PublicMember> = session[appId] && session[appId].members || [];
    
    try {
      const { status, authToken, member } = await this.authService.generalLogin(
        appCache, { appId, account, password, loggedInMembers },
      );

      switch (status) {
        case LoginStatus.E_NO_MEMBER:
          return { code: 'E_NO_MEMBER', message: 'no such member' };
        case LoginStatus.E_PASSWORD:
          return { code: 'E_PASSWORD', message: 'password does not match' };
        case LoginStatus.I_RESET_PASSWORD:
          return { code: 'I_RESET_PASSWORD', message: 'please get reset password email' };
      }

      if (member.isBusiness && !isBusinessModuleEnable) {
        return { code: 'E_NO_MODULE', message: 'business_member module disabled' };
      }

      const { fingerPrintId, geoLocation } = cookies;
      const deviceStatus: LoginDeviceStatus = fingerPrintId ? await this.deviceService.checkAndBindDevices(
        appCache,
        {
          appId,
          memberId: member.id,
          memberRole: member.role,
          userAgent: userAgent || '',
          geoLocation,
          fingerPrintId,
        },
      ) : LoginDeviceStatus.UNSUPPORTED;

      switch (deviceStatus) {
        case LoginDeviceStatus.BIND_LIMIT_EXCEED:
          return {
            code: 'E_BIND_DEVICE',
            message: 'The number of device bind for this member reach limit.',
          };
        case LoginDeviceStatus.LOGIN_LIMIT_EXCEED:
          return {
            code: 'E_LOGIN_DEVICE',
            message: 'The number of device login for this member reach limit.',
          };
        default:
          break;
      }

      session[appId] = {
        currentMemberId: member.id,
        members: [
          ...loggedInMembers.filter((loggedInMember) => loggedInMember.id !== member.id),
          {
            id: member.id,
            orgId: member.orgId,
            appId: member.appId,
            email: member.email,
            username: member.username,
            name: member.name,
            pictureUrl: member.pictureUrl,
            isBusiness: member.isBusiness,
          },
        ],
      };

      return {
        code: 'SUCCESS',
        message: 'login successfully',
        result: { authToken, deviceStatus },
      };
    } catch (error) {
      this.logger.error(error);
      return {
        code: error.name,
        message: error.message,
        result: null,
      };
    }
  }

  @Post('token')
  async generateCrossServerToken(
    @Local('appCache') appCache: AppCache,
    @Body() body: CrossServerTokenDTO,
  ) {
    const authToken = await this.authService.generateCrossServerToken(appCache, body);
    return {
      code: 'SUCCESS',
      message: 'get auth token successfully',
      result: { authToken },
    };
  }

  @Post('password/temporary')
  async generateTmpPassword(@Body() body: GenerateTmpPasswordDTO) {
    try {
      const { appId, applicant, email, purpose } = body;

      const result = await this.authService.generateTmpPassword(appId, email, applicant, purpose);
      return {
        code: 'SUCCESS',
        message: 'get temporary password successfully',
        result,
      };
    } catch (err) {
      this.logger.error(err);
      return {
        code: 'E_TMP_PASSWORD',
        message: 'failed to generate temporary password',
        result: null,
      };
    }
  }
}
