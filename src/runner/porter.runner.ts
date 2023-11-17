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
import { PodcastService } from '~/podcast/podcast.service';
import { ProgramContent } from '../program/entity/program_content.entity';
import { APIException } from '~/api.excetion';

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
    super(PorterRunner.name, 5000, logger, distributedLockService, shutdownService);
  }

  async delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public async getProgramContentById(manager: EntityManager, programContentId: string): Promise<ProgramContent> {
    const programContentRepo = manager.getRepository(ProgramContent);
    const programContent = await programContentRepo.findOneBy({ id: programContentId });

    if (!programContent) {
      throw new APIException({
        code: 'E_NO_PROGRAM_CONTENT',
        message: 'Program content not found',
        result: null,
      });
    }

    return programContent;
  }

  async portLastLoggedIn(manager: EntityManager): Promise<void> {
    console.log('portLastLoggedIn');

    const lastLoggedInMemberKeys: string[] | null = await this.cacheService.getClient().keys('last-logged-in:*');

    if (!lastLoggedInMemberKeys) {
      console.warn('No last logged in member keys found');
      return;
    }

    const memberLastLoggedInTimestamps: (string | null)[] =
      lastLoggedInMemberKeys.length > 0 ? await this.cacheService.getClient().mget(lastLoggedInMemberKeys) : [];

    for (let index = 0; index < lastLoggedInMemberKeys.length; index++) {
      const key: string = lastLoggedInMemberKeys[index];
      const [, memberId]: string[] = key.split(':');

      let loginedAt: string | null = memberLastLoggedInTimestamps[index];

      if (loginedAt) {
        const localDate = new Date(loginedAt);
        loginedAt = localDate.toISOString();
      }

      try {
        await manager.update(Member, memberId, { loginedAt });

        await manager.findOne(Member, { where: { id: memberId } });

        await this.cacheService.getClient().del(key);
      } catch (error) {
        console.error(`porting ${key} failed:`, error);
      }
    }
  }

  async portPlayerEvent(manager: EntityManager): Promise<void> {
    const pattern = 'program-content-event:*:program-content:*:*';
    const allKeys = await this.cacheService.getClient().keys(pattern);
    const batchSize = 30;
    const programContentLogs: ProgramContentLog[] = [];

    for (let i = 0; i < allKeys.length; i += batchSize) {
      const batchKeys = allKeys.slice(i, i + batchSize);
      const values = await this.cacheService.getClient().mget(batchKeys);

      for (let j = 0; j < batchKeys.length; j++) {
        const key = batchKeys[j];
        const valueString = values[j];
        const [, memberId, , programContentId] = key.split(':');
        const value = JSON.parse(valueString || '{}');

        try {
          const programContent = await this.getProgramContentById(manager, programContentId);
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
    }

    if (programContentLogs.length > 0) {
      try {
        await manager.save(programContentLogs);
        await this.cacheService.getClient().del(...allKeys);
      } catch (error) {
        console.error(`Batch saving or deleting keys failed: ${error}`);
      }
    }
  }

  async portPodcastProgram(manager: EntityManager): Promise<void> {
    const pattern = 'podcast-program-event:*:podcast-program:*:*';
    const batchSize = 1;

    const allKeys = await this.cacheService.getClient().keys(pattern);
    const updateData = [];

    for (let i = 0; i < allKeys.length; i += batchSize) {
      const batchKeys = allKeys.slice(i, i + batchSize);
      const values: (string | null)[] = await this.cacheService.getClient().mget(batchKeys);

      for (let j = 0; j < batchKeys.length; j++) {
        const key = batchKeys[j];
        const [, memberId, , podcastProgramId]: string[] = key.split(':');
        const value: { progress?: number; podcastAlbumId?: string } = JSON.parse(values[j] || '{}');

        updateData.push({
          memberId,
          podcastProgramId,
          progress: value.progress,
          lastProgress: value.progress,
          podcastAlbumId: value.podcastAlbumId || null,
        });
      }

      try {
        if (updateData.length > 0) {
          await this.podcastService.upsertPodcastProgramProgressBatch(manager, updateData);
          await Promise.all(batchKeys.map((key) => this.cacheService.getClient().del(key)));
        }
      } catch (error) {
        console.error(`Batch upsert failed: ${error}`);
      }
    }
  }

  async execute(manager: EntityManager): Promise<void> {
    console.log('start');

    const errors: any[] = [];

    const handlePorting = async (taskName: string, taskFunction: () => Promise<void>) => {
      try {
        console.log(`porting ${taskName}`);
        await taskFunction();
        console.log(`finishing porting ${taskName}`);
      } catch (error) {
        console.error(`port ${taskName} failed:`, error);
        errors.push(error);
      }
    };

    await handlePorting('last logged in', () => this.portLastLoggedIn(this.entityManager));
    await handlePorting('player event', () => this.portPlayerEvent(this.entityManager));
    // await handlePorting('podcast event', () => this.portPodcastProgram(this.entityManager));

    if (errors.length > 0) {
      console.error(errors, 'Porting errors occurred');
    }
  }

  async checkAndCallHeartbeat(): Promise<void> {
    const heartbeatUrl = process.env.PORTER_HEARTBEAT_URL;
    if (!heartbeatUrl) {
      console.warn('Heartbeat URL is not set.');
      return;
    }
    await axios.get(heartbeatUrl);
  }
}
