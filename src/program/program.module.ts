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
import { PorterProgramService } from './porter-program.service';
import { UtilityModule } from '~/utility/utility.module';

@Module({
  controllers: [ProgramController],
  imports: [AuthModule, MemberModule, UtilityModule],
  providers: [
    ProgramService,
    ProgramPlanService,
    MemberService,
    DefinitionInfrastructure,
    ProgramInfrastructure,
    UtilityService,
    PorterProgramService,
  ],
  exports: [ProgramService, PorterProgramService, ProgramInfrastructure],
})
export class ProgramModule {}
