import { Request } from 'express';
import { Body, Controller, Headers, Post, Req, Session } from '@nestjs/common';

import { PublicMember } from '~/member/member.type';
import { AppCache } from '~/app/app.type';
import { Local } from '~/decorator';

import { AuthService } from './auth.service';
import { CrossServerTokenDTO, GeneralLoginDTO, LoginStatus } from './auth.type';
import { LoginDeviceStatus } from './device/device.type';

@Controller({
  path: 'auth',
  version: ['2'],
})
export class AuthController {
  constructor(
    private readonly authService: AuthService,
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
      const deviceStatus: LoginDeviceStatus = LoginDeviceStatus.UNSUPPORTED;

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
      console.error(error);
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
}
