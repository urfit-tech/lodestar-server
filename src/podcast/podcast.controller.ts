import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtMember } from '~/auth/auth.dto';
import { AuthGuard } from '~/auth/auth.guard';
import { Local } from '~/decorator';
import { MEMBER_PAGE_PODCAST_STAFF_PERMISSIONS, resolveTargetMemberId } from '~/auth/authorization.helper';
import { PodcastService } from './podcast.service';

@UseGuards(AuthGuard)
@Controller({
  path: 'podcasts',
  version: '2',
})
export class PodcastController {
  constructor(private podcastService: PodcastService) {}

  @Get()
  async getPodcastByMemberId(@Local('member') member: JwtMember, @Req() request: Request) {
    const { memberId } = request.query;

    return this.podcastService.getPodcastByMemberId(
      member.appId,
      resolveTargetMemberId(member, memberId, MEMBER_PAGE_PODCAST_STAFF_PERMISSIONS),
    );
  }
}
