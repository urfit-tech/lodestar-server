import { Injectable, Logger } from '@nestjs/common';

import { DistributedLockService } from '~/utility/lock/distributed_lock.service';
import { ShutdownService } from '~/utility/shutdown/shutdown.service';

import { Runner } from './runner';
import { CacheService } from '~/utility/cache/cache.service';
import axios from 'axios';
import { InjectEntityManager } from '@nestjs/typeorm';
import { Member } from '~/member/entity/member.entity';
import { EntityManager } from 'typeorm';
import { ProgramContentLog } from '~/entity/ProgramContentLog';
import { ProgramService } from '~/program/program.service';
import { PodcastService } from '~/podcast/podcast.service'
import { ProgramContent } from '../program/entity/program_content.entity';


@Injectable()
export class PorterRunner extends Runner {
  constructor(
    protected readonly logger: Logger,
    protected readonly distributedLockService: DistributedLockService,
    protected readonly shutdownService: ShutdownService,
    private readonly cacheService: CacheService,
    private readonly programService: ProgramService,
    private readonly podcastService: PodcastService,

    @InjectEntityManager() private readonly entityManager: EntityManager,

  ) {
    super(PorterRunner.name, 1000, logger, distributedLockService, shutdownService);
  }

  async portLastLoggedIn(): Promise<void> {
    console.log("portLastLoggedIn")

    const lastLoggedInMemberKeys: string | null = await this.cacheService.getClient().get('last-logged-in:*');
    
    const memberLastLoggedInTimestamps: (string | null)[] = lastLoggedInMemberKeys.length > 0 
        ? await this.cacheService.getClient().mget(lastLoggedInMemberKeys) 
        : [];

    for (let index = 0; index < lastLoggedInMemberKeys.length; index++) {
      const key: string = lastLoggedInMemberKeys[index];
      const [, memberId]: string[] = key.split(':');
      
      const loginedAt: string | null = memberLastLoggedInTimestamps[index];

      try {
        await this.entityManager.update(Member, memberId, { loginedAt });
        await this.cacheService.getClient().del(key);
      } catch (error) {
        console.error(`porting ${key} failed:`, error);
      }
    }
  }

  async execute(): Promise<void> {
    console.log("start")
    if (process.env.PORTER_HEARTBEAT_URL) {
      await axios.get(process.env.PORTER_HEARTBEAT_URL)
    }

    try {
      console.log('porting last logged in')
      await this.portLastLoggedIn()
      console.log('finishing porting last logged in')
    } catch (error) {
      console.error('port last logged in failed:', error)
    }
  }

}
