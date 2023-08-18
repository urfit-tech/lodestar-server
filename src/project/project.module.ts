import { Module } from '@nestjs/common';
import { ProjectPlanService } from './project-plan/project-plan.service';

@Module({
  providers: [ProjectPlanService],
})
export class ProjectModule {}
