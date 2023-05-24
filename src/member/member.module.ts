import { Module } from '@nestjs/common'

import { MemberService } from './member.service';
import { MemberInfrastructure } from './member.infra';

@Module({
  providers: [MemberInfrastructure, MemberService],
  exports: [MemberInfrastructure, MemberService],
})
export class MemberModule {}
