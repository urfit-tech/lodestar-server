import { Request } from 'express';
import { Body, Controller, Headers, Logger, Post, Req, UseGuards } from '@nestjs/common';
import DeviceService from './device.service';
import { ManageLoggedInLimitDTO } from './device.dto';
import { Local } from '~/decorator';
import { AppCache } from '~/app/app.type';
import { APIException } from '~/api.excetion';
import { CacheService } from '~/utility/cache/cache.service';
import { clearDeviceLoginChallenge, matchDeviceLoginChallenge } from '../auth-limits';
import { SameSiteRequestGuard } from '../same-site.guard';

@UseGuards(SameSiteRequestGuard)
@Controller({
  path: 'device',
  version: '2',
})
export class DeviceController {
  constructor(
    private readonly deviceService: DeviceService,
    private readonly cacheService: CacheService,
    private readonly logger: Logger,
  ) {}

  @Post('manage-logged-in-limit')
  async logoutEarlyLoginedDevice(
    @Req() request: Request,
    @Local('appCache') appCache: AppCache | undefined,
    @Headers('User-Agent') userAgent: string | undefined,
    @Body() body: ManageLoggedInLimitDTO,
  ) {
    // members may only manage their devices through their own app's host
    if (!appCache?.id || body.appId !== appCache.id) {
      throw new APIException({ code: 'E_APP_MISMATCH', message: 'app mismatch', result: null }, 403);
    }
    const appId = appCache.id;
    const { memberId, fingerPrintId: bodyFingerPrint } = body;
    const { fingerPrintId: cookieFingerPrint } = request.cookies || {};
    const fingerPrintId =
      bodyFingerPrint && !cookieFingerPrint
        ? this.deviceService.getFingerPrintFromUa(bodyFingerPrint, userAgent)
        : cookieFingerPrint;

    // only the browser that has just signed in and reached the login device limit may sign out older devices
    const redis = this.cacheService.getClient();
    if (!(await matchDeviceLoginChallenge(redis, appId, memberId, fingerPrintId))) {
      return { code: 'E_DEVICE_CHALLENGE', message: 'device challenge required', result: null };
    }

    try {
      const memberDevices = await this.deviceService.getLoginDevices(memberId);
      if (memberDevices.length === 0) {
        throw new APIException({
          code: 'E_DEVICE_LOGINED_EMPTY',
          message: 'No device are currently logged in.',
          result: null,
        });
      }
      const isLoginDeviceReachedLimit = await this.deviceService.checkLoginDeviceReachedLimit(memberId, appCache);
      if (!isLoginDeviceReachedLimit) {
        throw new APIException({
          code: 'E_DEVICE_LOGINED_NOT_REACHED_LIMIT',
          message: 'The logged-in devices have not reached the limit.',
          result: null,
        });
      }
      await this.deviceService.logoutExcessDevices(memberId, appCache);
      await clearDeviceLoginChallenge(redis, appId, memberId);
    } catch (error) {
      this.logger.error(`manage logged in device failed. appId: ${appId}, error: ${error?.message}`);
      throw new APIException({
        code: 'E_MANAGE_LOGGED_IN_DEVICE',
        message: `manage login device limit failed,error:${error.message}`,
        result: null,
      });
    }
    return {
      code: 'SUCCESS',
      message: 'Manage device limit success, the logged-in devices have been cleared.',
      result: null,
    };
  }
}
