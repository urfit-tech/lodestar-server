import { Request } from 'express';
import { Body, Controller, Headers, Logger, Post, Req } from '@nestjs/common';
import DeviceService from './device.service';
import { ManageLoggedInLimitDTO } from './device.dto';
import { Local } from '~/decorator';
import { AppCache } from '~/app/app.type';
import { APIException } from '~/api.excetion';

@Controller({
  path: 'device',
  version: '2',
})
export class DeviceController {
  constructor(private readonly deviceService: DeviceService, private readonly logger: Logger) {}

  @Post('manage-logged-in-limit')
  async logoutEarlyLoginedDevice(
    @Req() request: Request,
    @Local('appCache') appCache: AppCache,
    @Headers('User-Agent') userAgent: string | undefined,
    @Body() body: ManageLoggedInLimitDTO,
  ) {
    const { cookies } = request;
    const { appId, memberId, fingerPrintId: bodyFingerPrint } = body;
    const { fingerPrintId: cookieFingerPrint } = cookies;
    const fingerPrintId =
      bodyFingerPrint && !cookieFingerPrint
        ? this.deviceService.getFingerPrintFromUa(bodyFingerPrint, userAgent)
        : cookieFingerPrint;
    try {
      const memberDevices = await this.deviceService.getLoginDevices(memberId);
      this.logger.log(`manage-limit,memberId:${memberId},fingerPrintId:${fingerPrintId}`);
      if (memberDevices.length === 0) {
        throw new APIException({
          code: 'E_DEVICE_LOGINED_EMPTY',
          message: `No device are currently logged in, appId:${appId}, memberId:${memberId}, fingerPrintId:${fingerPrintId}`,
          result: null,
        });
      }
      const isLoginDeviceReachedLimit = await this.deviceService.checkLoginDeviceReachedLimit(memberId, appCache);
      if (!isLoginDeviceReachedLimit) {
        throw new APIException({
          code: 'E_DEVICE_LOGINED_NOT_REACHED_LIMIT',
          message: `The logged-in devices have not reached the limit. , appId:${appId}, memberId:${memberId}, fingerPrintId:${fingerPrintId}`,
          result: null,
        });
      }
      await this.deviceService.logoutExcessDevices(memberId, appCache);
    } catch (error) {
      this.logger.error(`manage logged in device failed. appId:${appId}, memberId:${memberId}, error: ${error}`);
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
