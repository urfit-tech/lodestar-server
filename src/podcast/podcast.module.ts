import { Module } from '@nestjs/common';
import { AuthModule } from '~/auth/auth.module';
import { DefinitionInfrastructure } from '~/definition/definition.infra';
import { MemberModule } from '~/member/member.module';
import { MemberService } from '~/member/member.service';
import { PodcastPlanService } from './podcast-plan/podcast-plan.service';
import { PodcastController } from './podcast.controller';
import { PodcastService } from './podcast.service';
import { PodcastInfrastructure } from './podcast.infra';
import { UtilityService } from '~/utility/utility.service';
import { PodcastPlanController } from './podcast-plan/podcast-plan.controller';
import { PodcastPlanInfrastructure } from './podcast-plan/podcast-plan.infra';

@Module({
  controllers: [PodcastController, PodcastPlanController],
  imports: [AuthModule, MemberModule],
  providers: [
    PodcastPlanService,
    PodcastService,
    MemberService,
    DefinitionInfrastructure,
    PodcastInfrastructure,
    UtilityService,
    PodcastPlanService,
    PodcastPlanInfrastructure,
  ],
  exports: [PodcastService],
})
export class PodcastModule {}
