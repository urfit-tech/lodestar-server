import { Module } from '@nestjs/common'
import { ProgramPackagePlanService } from './program-package-plan/program-package-plan.service'
import { ProgramPlanService } from './program-plan/program-plan.service'

@Module({
  providers: [ProgramPlanService, ProgramPackagePlanService],
})
export class ProgramModule {}
