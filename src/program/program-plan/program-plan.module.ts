import { Module } from '@nestjs/common';
import { ProgramPlanInfrastructure } from './program-plan.infra';
@Module({
  providers: [ProgramPlanInfrastructure],
  exports: [ProgramPlanInfrastructure],
})
export class ProgramPlanModule {}
