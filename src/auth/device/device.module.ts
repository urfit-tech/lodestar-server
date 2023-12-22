import { Module } from '@nestjs/common';

import DeviceService from './device.service';
import { DeviceInfrastructure } from './device.infra';
import { MemberInfrastructure } from '~/member/member.infra';

@Module({
  providers: [DeviceService, DeviceInfrastructure, MemberInfrastructure],
  exports: [DeviceService, DeviceInfrastructure],
})
export class DeviceModule {}
