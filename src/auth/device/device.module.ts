import { Logger, Module } from '@nestjs/common';
import DeviceService from './device.service';
import { DeviceInfrastructure } from './device.infra';
import { MemberInfrastructure } from '~/member/member.infra';
import { DeviceController } from './device.controller';

@Module({
  controllers: [DeviceController],
  providers: [Logger, DeviceService, DeviceInfrastructure, MemberInfrastructure],
  exports: [DeviceService, DeviceInfrastructure],
})
export class DeviceModule {}
