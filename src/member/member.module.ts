import { Module } from '@nestjs/common'

import { MemberService } from './member.service';

@Module({
  providers: [MemberService],
  exports: [MemberService],
})
export class MemberModule {}
