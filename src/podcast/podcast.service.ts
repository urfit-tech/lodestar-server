import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';

@Injectable()
export class PodcastService {
  constructor(@InjectEntityManager() private readonly entityManager: EntityManager) {}

  public async getPodcastByMemberId(appId: string, memberId: string) {
    return;
  }
}
