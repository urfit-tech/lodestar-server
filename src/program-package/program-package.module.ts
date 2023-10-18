import { Module } from '@nestjs/common';

import { ProgramPackageService } from './program-package.service';
import { ProgramPackagePlanService } from './program-package-plan/program-package-plan.service';
import { ProgramPackageController } from './program-package.controller';
import { AuthModule } from '~/auth/auth.module';
import { MemberModule } from '~/member/member.module';
import { MemberService } from '~/member/member.service';
import { DefinitionInfrastructure } from '~/definition/definition.infra';
import { ProgramPackageInfrastructure } from './program-package.infra';
import { UtilityService } from '~/utility/utility.service';

@Module({
  controllers: [ProgramPackageController],
  imports: [AuthModule, MemberModule],
  providers: [
    ProgramPackageService,
    ProgramPackagePlanService,
    MemberService,
    DefinitionInfrastructure,
    ProgramPackageInfrastructure,
    UtilityService,
  ],
  exports: [],
})
export class ProgramPackageModule {}
