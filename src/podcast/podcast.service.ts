import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { APIException } from '~/api.excetion';
import { MemberService } from '~/member/member.service';
import { PodcastInfrastructure } from './podcast.infra';
import { PodcastProgramProgress } from '~/entity/PodcastProgramProgress'
import { PodcastAlbum } from '~/entity/PodcastAlbum'

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

  public async upsertPodcastProgramProgress(
    memberId: string,
    podcastProgramId: string,
    progress: number,
    lastProgress: number,
    podcastAlbumId: string | null,
  ): Promise<PodcastProgramProgress> {
    const podcastProgramProgressRepo = this.entityManager.getRepository(PodcastProgramProgress);
    let podcastProgramProgress = await podcastProgramProgressRepo.findOne({
      where: { memberId, podcastProgramId },
    });

    let podcastAlbum = null;
    if (podcastAlbumId) {
      const podcastAlbumRepo = this.entityManager.getRepository(PodcastAlbum);

      podcastAlbum = await podcastAlbumRepo.findOneBy({ id: podcastAlbumId });
    }

    if (podcastProgramProgress) {
      podcastProgramProgress.progress = progress;
      podcastProgramProgress.lastProgress = lastProgress;
      podcastProgramProgress.podcastAlbum = podcastAlbum; 
    } else {
      
      podcastProgramProgress = podcastProgramProgressRepo.create({
        memberId,
        podcastProgramId,
        progress,
        lastProgress,
        podcastAlbum, 
      });
    }

    return podcastProgramProgressRepo.save(podcastProgramProgress);
  }
}
