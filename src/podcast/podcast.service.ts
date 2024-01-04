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
    progressInfoList: PodcastProgressInfo[],
    entityManager: EntityManager,
  ): Promise<PodcastProgramProgress[]> {
    const uniqueMap = new Map<string, PodcastProgramProgress>();

    for (const info of progressInfoList) {
      const uniqueKey = `${info.memberId}_${info.podcastProgramId}`;
      let podcastProgramProgress = uniqueMap.get(uniqueKey);

      if (!podcastProgramProgress) {
        podcastProgramProgress = await this.podcastInfra.findPodcastProgramProgress(info, entityManager);

        if (!podcastProgramProgress) {
          podcastProgramProgress = entityManager.getRepository(PodcastProgramProgress).create(info);
          podcastProgramProgress.createdAt = info.created_at;
        }
      }

      podcastProgramProgress.progress = info.progress || 1;
      podcastProgramProgress.lastProgress = info.lastProgress || 1;
      podcastProgramProgress.updatedAt = info.created_at;

      podcastProgramProgress.podcastAlbumId =
        info.podcastAlbumId && info.podcastAlbumId.trim() !== '' ? info.podcastAlbumId : null;

      uniqueMap.set(uniqueKey, podcastProgramProgress);
    }

    const podcastProgramProgressToSave = Array.from(uniqueMap.values());
    await this.podcastInfra.savePodcastProgramProgress(podcastProgramProgressToSave, entityManager);
    return podcastProgramProgressToSave;
  }
}
