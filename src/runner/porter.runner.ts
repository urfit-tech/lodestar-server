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

  async delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  

  async portLastLoggedIn(): Promise<void> {
    console.log("portLastLoggedIn")

    const lastLoggedInMemberKeys: string[] | null = await this.cacheService.getClient().keys('last-logged-in:*');

    if (!lastLoggedInMemberKeys) {
      console.warn('No last logged in member keys found');
      return;
    }
    
    const memberLastLoggedInTimestamps: (string | null)[] = lastLoggedInMemberKeys.length > 0 
        ? await this.cacheService.getClient().mget(lastLoggedInMemberKeys) 
        : [];

    for (let index = 0; index < lastLoggedInMemberKeys.length; index++) {
      const key: string = lastLoggedInMemberKeys[index];
      const [, memberId]: string[] = key.split(':');
      
      let loginedAt: string | null = memberLastLoggedInTimestamps[index];
    
      if (loginedAt) {
        const localDate = new Date(loginedAt);
        loginedAt = localDate.toISOString();
      }
    
      try {
        await this.entityManager.update(Member, memberId, { loginedAt });
    
        await this.entityManager.findOne(Member, { where: { id: memberId } });   
    
        await this.cacheService.getClient().del(key);
      } catch (error) {
        console.error(`porting ${key} failed:`, error);
      }
    }
        
  }

  async portPlayerEvent(): Promise<void> {
    const pattern = 'program-content-event:*:program-content:*:*';
    const allKeys = await this.cacheService.getClient().keys(pattern);
    const batchSize = 1; 
  
    for (let i = 0; i < allKeys.length; i += batchSize) {
      const batchKeys = allKeys.slice(i, i + batchSize);
      const values = await this.cacheService.getClient().mget(batchKeys);
      const programContentLogs: ProgramContentLog[] = [];
  
      for (let j = 0; j < batchKeys.length; j++) {
        const key = batchKeys[j];
        const valueString = values[j];
        const [, memberId, , programContentId] = key.split(':');
        const value = JSON.parse(valueString || '{}');
  
        try {
          const programContent = await this.programService.getProgramContentById(programContentId);
          const programContentLog = new ProgramContentLog();
          programContentLog.memberId = memberId;
          programContentLog.programContent = programContent;
          programContentLog.playbackRate = value.playbackRate;
          programContentLog.startedAt = value.startedAt || 0;
          programContentLog.endedAt = value.endedAt || 0;
  
          programContentLogs.push(programContentLog);
        } catch (error) {
          console.error(`Processing ${key} failed: ${error}`);
        }
      }
  
      if (programContentLogs.length > 0) {
        try {
          await this.entityManager.save(programContentLogs);
          for (let key of batchKeys) {
            await this.cacheService.getClient().del(key);
          }
        } catch (error) {
          console.error(`Batch saving failed: ${error}`);
        }
      }

    }
  }
  
  
  
  async portPodcastProgram(): Promise<void> {
    const pattern = 'podcast-program-event:*:podcast-program:*:*';
    const batchSize = 10; 
  
    const allKeys = await this.cacheService.getClient().keys(pattern);
  
    for (let i = 0; i < allKeys.length; i += batchSize) {
      const batchKeys = allKeys.slice(i, i + batchSize);
      const values: (string | null)[] = await this.cacheService.getClient().mget(batchKeys);
      const updateData = [];
  
      for (let j = 0; j < batchKeys.length; j++) {
        const key = batchKeys[j];
        const [, memberId, , podcastProgramId]: string[] = key.split(':');
        const value: { progress?: number; podcastAlbumId?: string } = JSON.parse(values[j] || '{}');
  
        updateData.push({
          memberId,
          podcastProgramId,
          progress: value.progress,
          lastProgress: value.progress,
          podcastAlbumId: value.podcastAlbumId || null
        });
      }
  
      try {
        if (updateData.length > 0) {
          await this.podcastService.upsertPodcastProgramProgressBatch(updateData);
          await Promise.all(batchKeys.map(key => this.cacheService.getClient().del(key)));
        }
      } catch (error) {
        console.error(`Batch upsert failed: ${error}`);
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

    try {
      console.log('porting player event')
      await this.portPlayerEvent()
      console.log('finishing porting player event')
    } catch (error) {
      console.error('port player event failed:', error)
    }

    try {
      console.log('porting podcast event')
      await this.portPodcastProgram()
      console.log('finishing porting podcast event')
    } catch (error) {
      console.error('port podcast event failed:', error)
    }
  }
  
}
