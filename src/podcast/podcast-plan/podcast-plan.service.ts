import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { APIException } from '~/api.excetion';
import { MemberService } from '~/member/member.service';
import { PodcastPlanInfrastructure } from './podcast-plan.infra';

@Injectable()
export class PodcastPlanService {
  constructor(
    private readonly podcastPlanInfra: PodcastPlanInfrastructure,
    private readonly memberService: MemberService,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}

  public async getPodcastPlanByMemberId(appId: string, memberId: string) {
    // Todo: check permission
    // ...

    const { data: memberData } = await this.memberService.getMembersByCondition(appId, { limit: 1 }, { id: memberId });
    if (memberData.length === 0) {
      throw new APIException({
        code: 'E_NO_MEMBER',
        message: 'member not found',
        result: null,
      });
    }

    return await this.podcastPlanInfra.getOwnedPodcastPlan(memberId, this.entityManager);
  }
}
