import { Module } from '@nestjs/common';

import DeviceService from './device.service';
import { DeviceInfrastructure } from './device.infra';
import { MemberInfrastructure } from '~/member/member.infra';
import { PaginationService } from '~/utility/pagination/pagination.service';

@Module({
  providers: [DeviceService, DeviceInfrastructure, MemberInfrastructure, PaginationService],
  exports: [DeviceService, DeviceInfrastructure],
})
export class DeviceModule {}
