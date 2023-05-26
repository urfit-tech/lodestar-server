import { Module } from '@nestjs/common'

import { DefinitionModule } from '~/definition/definition.module';

import { MemberService } from './member.service';
import { MemberInfrastructure } from './member.infra';

@Module({
  imports: [DefinitionModule],
  providers: [MemberInfrastructure, MemberService],
  exports: [MemberInfrastructure, MemberService],
})
export class MemberModule {}
