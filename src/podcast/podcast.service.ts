import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { APIException } from '~/api.excetion';
import { MemberService } from '~/member/member.service';
import { PodcastInfrastructure } from './podcast.infra';
import { PodcastProgramProgress } from '~/entity/PodcastProgramProgress'
import { PodcastAlbum } from '~/entity/PodcastAlbum'
import { Member } from '~/member/entity/member.entity';

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

  public async upsertPodcastProgramProgressBatch(
    updates: {
      memberId: string,
      podcastProgramId: string,
      progress: number,
      lastProgress: number,
      podcastAlbumId: string | null,
    }[]
  ): Promise<PodcastProgramProgress[]> {
    const podcastProgramProgressRepo = this.entityManager.getRepository(PodcastProgramProgress);
    const updatesToSave = [];
  
    for (const update of updates) {
      const member = await this.findMember(update.memberId);
      if (!member) {
        console.log(`Member with id ${update.memberId} not found. Skipping update.`);
        continue;
      }
  
      const podcastAlbum = update.podcastAlbumId ? await this.findPodcastAlbum(update.podcastAlbumId) : null;
      let podcastProgramProgress = await podcastProgramProgressRepo.findOneBy({
        memberId: update.memberId,
        podcastProgramId: update.podcastProgramId,
      });
  
      if (!podcastProgramProgress) {
        podcastProgramProgress = podcastProgramProgressRepo.create({
          member,
          podcastProgramId: update.podcastProgramId,
        });
      }
  
      podcastProgramProgress.progress = update.progress;
      podcastProgramProgress.lastProgress = update.lastProgress;
      podcastProgramProgress.podcastAlbum = podcastAlbum;
  
      updatesToSave.push(podcastProgramProgress);
    }
  
    return await podcastProgramProgressRepo.save(updatesToSave);
  }
  
  private async findMember(memberId: string): Promise<Member> {
    const memberRepo = this.entityManager.getRepository(Member);
    const member = await memberRepo.findOneBy({ id: memberId });
    if (!member) {
      throw new APIException({
        code: 'E_NO_MEMBER',
        message: `Member with id ${memberId} not found`,
        result: null,
      });
    }
    return member;
  }

  private async findPodcastAlbum(podcastAlbumId: string): Promise<PodcastAlbum | null> {
    const podcastAlbumRepo = this.entityManager.getRepository(PodcastAlbum);
    return await podcastAlbumRepo.findOneBy({ id: podcastAlbumId });
  }
  
}
