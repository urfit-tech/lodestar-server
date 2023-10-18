import { Module } from '@nestjs/common';

import { ProgramService } from './program.service';
import { ProgramPlanService } from './program-plan/program-plan.service';
import { ProgramController } from './program.controller';
import { AuthModule } from '~/auth/auth.module';
import { MemberService } from '~/member/member.service';
import { MemberModule } from '~/member/member.module';
import { DefinitionInfrastructure } from '~/definition/definition.infra';
import { ProgramInfrastructure } from './program.infra';
import { UtilityService } from '~/utility/utility.service';

@Module({
  controllers: [ProgramController],
  imports: [AuthModule, MemberModule],
  providers: [
    ProgramService,
    ProgramPlanService,
    MemberService,
    DefinitionInfrastructure,
    ProgramInfrastructure,
    UtilityService,
  ],
  exports: [ProgramService],
})
export class ProgramModule {}
