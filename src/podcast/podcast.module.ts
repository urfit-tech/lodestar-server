import { Module } from '@nestjs/common';
import { PodcastPlanService } from './podcast-plan/podcast-plan.service';

@Module({
  providers: [PodcastPlanService],
})
export class PodcastModule {}
