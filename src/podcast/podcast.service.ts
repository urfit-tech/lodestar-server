import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { APIException } from '~/api.excetion';
import { MemberService } from '~/member/member.service';
import { PodcastInfrastructure } from './podcast.infra';
import { PodcastProgramProgress } from '~/podcast/entity/PodcastProgramProgress';
import { PodcastProgressInfo } from './podcast.types';

@Injectable()
export class PodcastService {
  constructor(
    private readonly podcastInfra: PodcastInfrastructure,
    private readonly memberService: MemberService,

    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}

  public async getPodcastByMemberId(appId: string, memberId: string) {
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

    const podcasts = await this.podcastInfra.getOwnedPodcasts(appId, memberId, this.entityManager);

    return podcasts.map((podcast) => ({
      ...podcast,
      durationSecond: Number(podcast.durationSecond || 0),
      salePrice: podcast.salePrice ? Number(podcast.salePrice) : null,
      listPrice: Number(podcast.listPrice || 0),
    }));
  }

  public async processPodcastProgramProgress(
    progressMap: Map<string, PodcastProgressInfo>,
    entityManager: EntityManager,
  ): Promise<PodcastProgramProgress[]> {
    const podcastProgramProgresssToSave: PodcastProgramProgress[] = [];

    for (const [, info] of progressMap) {
      let podcastProgramProgress = await this.podcastInfra.findPodcastProgramProgress(info, entityManager);

      if (!podcastProgramProgress) {
        podcastProgramProgress = entityManager.getRepository(PodcastProgramProgress).create(info);
        podcastProgramProgress.createdAt = info.created_at;
      } else {
        podcastProgramProgress.progress = info.progress;
        podcastProgramProgress.lastProgress = info.lastProgress;
        podcastProgramProgress.podcastAlbumId = info.podcastAlbumId;
        podcastProgramProgress.updatedAt = info.created_at;
      }

      podcastProgramProgresssToSave.push(podcastProgramProgress);
    }

    await this.podcastInfra.savePodcastProgramProgress(podcastProgramProgresssToSave, entityManager);
    return podcastProgramProgresssToSave;
  }
}
