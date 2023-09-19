import { Module, Logger, forwardRef } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AppModule } from '~/app/app.module';
import { MemberInfrastructure } from '~/member/member.infra';
import { PermissionModule } from '~/permission/permission.module';
import { AuthService } from './auth.service';
import { CacheService } from '~/utility/cache/cache.service';
import { AuthInfrastructure } from './auth.infra';
import { MemberModule } from '~/member/member.module';

@Module({
  controllers: [AuthController],
  imports: [AppModule, PermissionModule, forwardRef(() => MemberModule)],
  providers: [Logger, AuthService, MemberInfrastructure, CacheService, AuthInfrastructure],
  exports: [AuthService],
})
export class AuthModule {}
