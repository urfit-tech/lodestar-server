import { Logger, Module } from '@nestjs/common';
import { AppModule } from '~/app/app.module';
import DeviceService from './device.service';
import { DeviceInfrastructure } from './device.infra';
import { MemberInfrastructure } from '~/member/member.infra';
import { DeviceController } from './device.controller';
import { CacheService } from '~/utility/cache/cache.service';

@Module({
  controllers: [DeviceController],
  imports: [AppModule],
  providers: [Logger, DeviceService, DeviceInfrastructure, MemberInfrastructure, CacheService],
  exports: [DeviceService, DeviceInfrastructure],
})
export class DeviceModule {}
