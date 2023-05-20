import { Module } from '@nestjs/common';

import { ProgramService } from './program.service';
import { ProgramPackagePlanService } from './program-package-plan/program-package-plan.service';
import { ProgramPlanService } from './program-plan/program-plan.service';

@Module({
  providers: [ProgramService, ProgramPlanService, ProgramPackagePlanService],
  exports: [ProgramService],
})
export class ProgramModule {}
