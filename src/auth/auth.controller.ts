import { Request, Response } from 'express';
import { Body, Controller, Headers, Logger, Post, Req, Res, Session } from '@nestjs/common';

import { PublicMember } from '~/member/member.type';
import { AppCache } from '~/app/app.type';
import { Local } from '~/decorator';

import { AuthService } from './auth.service';
import { RefreshTokenDTO } from './auth.dto';
import { CrossServerTokenDTO, GenerateTmpPasswordDTO, GeneralLoginDTO, LoginStatus, RefreshStatus } from './auth.type';
import { LoginDeviceStatus } from './device/device.type';
import DeviceService from './device/device.service';
import { ApiTags, ApiExcludeEndpoint, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import CrossServerTokenDTOProperty from './api_property/cross_server_token_dto';

@ApiTags('Auth')
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
  @ApiExcludeEndpoint()
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
    const loggedInMembers: Array<PublicMember> = (session[appId] && session[appId].members) || [];

    try {
      const { status, authToken, member } = await this.authService.generalLogin(appCache, {
        appId,
        account,
        password,
        loggedInMembers,
      });

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
      const deviceStatus: LoginDeviceStatus = fingerPrintId
        ? await this.deviceService.checkAndBindDevices(appCache, {
            appId,
            memberId: member.id,
            memberRole: member.role,
            userAgent: userAgent || '',
            geoLocation,
            fingerPrintId,
          })
        : LoginDeviceStatus.UNSUPPORTED;

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
      return { code: error.name, message: error.message };
    }
  }

  @Post('refresh-token')
  @ApiExcludeEndpoint()
  async refreshToken(
    @Local('appCache') appCache: AppCache,
    @Headers('user-agent') userAgents: string,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Session() session: Record<string, any> | undefined,
    @Body() body: RefreshTokenDTO,
  ) {
    const { cookies } = request;
    const { appId, fingerPrintId: bodyFingerPrint, geoLocation } = body;
    const { fingerPrintId: cookieFingerPrint } = cookies;
    const fingerPrintId =
      bodyFingerPrint && !cookieFingerPrint
        ? this.deviceService.getFingerPrintFromUa(bodyFingerPrint, userAgents)
        : cookieFingerPrint;
    const sessionMemberId = session[appId] && session[appId].currentMemberId;
    const loggedInMembers: Array<PublicMember> = (session[appId] && session[appId].members) || [];

    response.cookie('fingerPrintId', fingerPrintId, { maxAge: 86400 * 1000 });
    geoLocation && response.cookie('geoLocation', geoLocation, { maxAge: 86400 * 1000 });

    if (!session) {
      if (bodyFingerPrint) {
        await this.deviceService.expireFingerPrintId(bodyFingerPrint);
      }
      return { code: 'E_SESSION', message: 'cannot get session' };
    }

    try {
      const { status, refreshedToken } = await this.authService.refreshToken(appCache, {
        fingerPrintId,
        sessionMemberId,
        loggedInMembers,
      });

      switch (status) {
        case RefreshStatus.E_NO_MEMBER:
          return { code: 'E_NO_MEMBER', message: 'no such member' };
        case RefreshStatus.E_SESSION_DESTROY:
          await new Promise((resolve) => request.session.destroy(resolve));
        case RefreshStatus.E_NO_DEVICE:
          return { code: 'E_NO_DEVICE', message: 'device is not available' };
      }

      return {
        code: 'SUCCESS',
        message: 'refresh a new auth token',
        result: { authToken: refreshedToken },
      };
    } catch (error) {
      this.logger.error(error);
      return { code: error.name, message: error.message };
    }
  }

  @Post('token')
  @ApiOperation({ summary: 'Generate Cross Server Token' })
  @ApiResponse({ status: 201, description: 'Token generated successfully.' })
  @ApiBody({ type: CrossServerTokenDTOProperty })
  async generateCrossServerToken(@Local('appCache') appCache: AppCache, @Body() body: CrossServerTokenDTO) {
    const authToken = await this.authService.generateCrossServerToken(appCache, body);
    return {
      code: 'SUCCESS',
      message: 'get auth token successfully',
      result: { authToken },
    };
  }

  @Post('password/temporary')
  @ApiExcludeEndpoint()
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
  @Post('/sign-cloudfront-cookies') signCookie(@Res() res: Response, @Body() body: { url: string }) {
    const cookies = this.authService.signCloudfrontCookies(body.url);
    res.cookie('CloudFront-Expires', cookies['CloudFront-Expires']);
    res.cookie('CloudFront-Key-Pair-Id', cookies['CloudFront-Key-Pair-Id']);
    res.cookie('CloudFront-Signature', cookies['CloudFront-Signature']);
    res.send('success set cookie');
  }
}
