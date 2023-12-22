import { Module, Logger, forwardRef } from '@nestjs/common';

import { AppModule } from '~/app/app.module';
import { MemberModule } from '~/member/member.module';
import { MailerModule } from '~/mailer/mailer.module';
import { PermissionModule } from '~/permission/permission.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthInfrastructure } from './auth.infra';
import DeviceService from './device/device.service';
import { CacheService } from '~/utility/cache/cache.service';
import { UtilityService } from '~/utility/utility.service';

@Module({
  controllers: [AuthController],
  imports: [AppModule, forwardRef(() => MemberModule), PermissionModule, MailerModule],
  providers: [Logger, AuthService, DeviceService, AuthInfrastructure, CacheService, UtilityService],
  exports: [AuthService],
})
export class AuthModule {}
