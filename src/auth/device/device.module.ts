import { Module } from '@nestjs/common';

import DeviceService from './device.service';
import { DeviceInfrastructure } from './device.infra';

@Module({
  providers: [DeviceService, DeviceInfrastructure],
  exports: [DeviceService, DeviceInfrastructure],
})
export class DeviceModule {}
