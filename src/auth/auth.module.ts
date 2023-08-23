import { Module, Logger } from '@nestjs/common';

import { AuthController } from './auth.controller';
import { AppModule } from '~/app/app.module';
import { MemberInfrastructure } from '~/member/member.infra';
import { PermissionModule } from '~/permission/permission.module';

import { AuthService } from './auth.service';
import { CacheService } from '~/utility/cache/cache.service';

@Module({
  controllers: [AuthController],
  imports: [AppModule, PermissionModule],
  providers: [Logger, AuthService, MemberInfrastructure, CacheService],
  exports: [AuthService],
})
export class AuthModule {}
