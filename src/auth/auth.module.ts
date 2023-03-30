import { Module } from '@nestjs/common'

import { AuthController } from './auth.controller'
import { AppModule } from '~/app/app.module'
import { MemberModule } from '~/member/member.module'
import { PermissionModule } from '~/permission/permission.module'

import { AuthService } from './auth.service'

@Module({
  controllers: [AuthController],
  imports: [MemberModule, AppModule, PermissionModule],
  providers: [AuthService],
})
export class AuthModule {}
