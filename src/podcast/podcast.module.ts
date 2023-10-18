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

@Module({
  controllers: [PodcastController],
  imports: [AuthModule, MemberModule],
  providers: [
    PodcastPlanService,
    PodcastService,
    MemberService,
    DefinitionInfrastructure,
    PodcastInfrastructure,
    UtilityService,
  ],
  exports: [],
})
export class PodcastModule {}
