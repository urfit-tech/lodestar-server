import { Module } from '@nestjs/common';

import { PermissionInfrastructure } from './permission.infra';

@Module({
  providers: [PermissionInfrastructure],
  exports: [PermissionInfrastructure],
})
export class PermissionModule {}
