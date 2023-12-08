import { DynamicModule, Injectable, Logger } from '@nestjs/common';

import { DistributedLockService } from '~/utility/lock/distributed_lock.service';
import { ShutdownService } from '~/utility/shutdown/shutdown.service';

import { Runner } from './runner';
import { CacheService } from '~/utility/cache/cache.service';
import axios from 'axios';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { ProgramContentLog } from '~/program/entity/ProgramContentLog';
import { MemberService } from '~/member/member.service';
import { ProgramService } from '~/program/program.service';
import { PodcastService } from '~/podcast/podcast.service';
import { PodcastProgressInfo } from '~/podcast/podcast.types';

@Injectable()
export class PorterRunner extends Runner {
  constructor(
    protected readonly logger: Logger,
    protected readonly distributedLockService: DistributedLockService,
    protected readonly shutdownService: ShutdownService,
    private readonly cacheService: CacheService,
    private readonly memberService: MemberService,
    private readonly programService: ProgramService,
    private readonly podcastService: PodcastService,

    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {
    super(PorterRunner.name, 5 * 60 * 1000, logger, distributedLockService, shutdownService);
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

      const loginedAt: string | null = memberLastLoggedInTimestamps[index];

      try {
        await this.memberService.updateMemberLoginDate(memberId, new Date(loginedAt), this.entityManager);

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

    for (let batchIndex = 0; batchIndex < allKeys.length; batchIndex += batchSize) {
      const batchKeys = allKeys.slice(batchIndex, batchIndex + batchSize);
      const values = await this.cacheService.getClient().mget(batchKeys);

      for (let keyIndex = 0; keyIndex < batchKeys.length; keyIndex++) {
        const key = batchKeys[keyIndex];
        const valueString = values[keyIndex];
        const [, memberId, , programContentId, createdAtString] = key.split(':');
        const createdAtTimestamp = parseInt(createdAtString, 10);
        const createdAtDate = new Date(createdAtTimestamp);
        const value = JSON.parse(valueString || '{}');

        try {
          const programContent = await this.programService.findProgramContentById(programContentId, manager);

          if (programContent) {
            const programContentLog = new ProgramContentLog();
            programContentLog.memberId = memberId;
            programContentLog.programContent = programContent;
            programContentLog.playbackRate = value.playbackRate || 1;
            programContentLog.startedAt = value.startedAt || 0;
            programContentLog.endedAt = value.endedAt || 0;
            programContentLog.createdAt = createdAtDate;

            programContentLogs.push(programContentLog);
          }
        } catch (error) {
          console.error(`Processing ${key} failed: ${error}`);
        }
      }
    }

    if (programContentLogs.length > 0) {
      try {
        await this.programService.saveProgramContentLogs(programContentLogs, manager);
        await this.cacheService.getClient().del(...allKeys);
      } catch (error) {
        console.error(`Batch saving or deleting keys failed: ${error}`);
      }
    }
  }

  async portPodcastProgram(manager: EntityManager): Promise<void> {
    const errors: Array<{ error: any }> = [];
    const pattern = 'podcast-program-event:*:podcast-program:*:*';
    const allKeys = await this.cacheService.getClient().keys(pattern);

    const progressMap = new Map<string, PodcastProgressInfo>();

    for (const key of allKeys) {
      const valueString = await this.cacheService.getClient().get(key);
      if (!valueString) continue;

      const [, memberId, , podcastProgramId, createdAtString] = key.split(':');
      const createdAtTimestamp = parseInt(createdAtString, 10);
      const createdAtDate = new Date(createdAtTimestamp);

      const value = JSON.parse(valueString);
      const progressInfo: PodcastProgressInfo = {
        memberId,
        podcastProgramId,
        progress: value.progress,
        lastProgress: value.progress,
        podcastAlbumId: value.podcastAlbumId,
        created_at: createdAtDate,
      };
      progressMap.set(memberId + '_' + podcastProgramId, progressInfo);
    }

    try {
      await this.podcastService.processPodcastProgramProgress(progressMap, manager);
      await this.cacheService.getClient().del(...allKeys);
    } catch (error) {
      console.error('Error processing podcast program progress:', error);
      errors.push({ error: error.message });
    }

    if (errors.length > 0) {
      throw new Error(JSON.stringify(errors));
    }
  }

  async checkAndCallHeartbeat(): Promise<void> {
    const heartbeatUrl = process.env.PORTER_HEARTBEAT_URL;
    if (!heartbeatUrl) {
      axios.get(heartbeatUrl);
      return;
    }
    await axios.get(heartbeatUrl);
  }

  async execute(entityManager?: EntityManager): Promise<void> {
    console.log('start');
    await this.checkAndCallHeartbeat();

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
    await handlePorting('podcast event', () => this.portPodcastProgram(this.entityManager));

    if (errors.length > 0) {
      console.error(errors, 'Porting errors occurred');
    }
  }
}