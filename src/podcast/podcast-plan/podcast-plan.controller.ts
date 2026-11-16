import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtMember } from '~/auth/auth.dto';
import { AuthGuard } from '~/auth/auth.guard';
import { Local } from '~/decorator';
import { MEMBER_PAGE_PODCAST_STAFF_PERMISSIONS, resolveTargetMemberId } from '~/auth/authorization.helper';
import { PodcastPlanService } from './podcast-plan.service';

@UseGuards(AuthGuard)
@Controller({
  path: 'podcast-plans',
  version: '2',
})
export class PodcastPlanController {
  constructor(private readonly podcastPlanService: PodcastPlanService) {}

  @Get()
  async getPodcastPlanByMemberId(@Local('member') member: JwtMember, @Req() request: Request) {
    const { memberId } = request.query;

    return this.podcastPlanService.getPodcastPlanByMemberId(
      member.appId,
      resolveTargetMemberId(member, memberId, MEMBER_PAGE_PODCAST_STAFF_PERMISSIONS),
    );
  }
}
