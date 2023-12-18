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
import { PorterProgramService } from '~/program/porter-program.service';
import { ProgramInfrastructure } from '~/program/program.infra';

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
    private readonly porterProgramService: PorterProgramService,
    private readonly programInfra: ProgramInfrastructure,

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

  async portPlayerEvent(manager: EntityManager, batchSize = 1000): Promise<void> {
    const pattern = 'program-content-event:*:program-content:*:*';
    let cursor = '0';

    do {
      const [newCursor, keys] = await this.porterProgramService.scanCacheForKeys(pattern, batchSize, cursor);
      cursor = newCursor;

      if (keys.length > 0) {
        const values = await this.porterProgramService.fetchValuesFromCache(keys);
        const keyValuePairs = this.porterProgramService.parseKeyValuePairs(keys, values);
        const programContentIds = new Set(keyValuePairs.map((kvp) => kvp.programContentId));
        const programContentsMap = await this.porterProgramService.fetchProgramContents(
          Array.from(programContentIds),
          manager,
        );
        const programContentLogs = this.porterProgramService.createProgramContentLogs(
          keyValuePairs,
          programContentsMap,
        );

        if (programContentLogs.length > 0) {
          try {
            await this.programInfra.saveProgramContentLogs(programContentLogs, manager);
            await this.porterProgramService.deleteProcessedKeysFromCache(keys);
          } catch (error) {
            await this.porterProgramService.handleBatchSaveFailure(programContentLogs, keys, manager);
          }
        }
      }
    } while (cursor !== '0');
  }

  async portPodcastProgram(manager: EntityManager, batchSize = 1000): Promise<void> {
    const pattern = 'podcast-program-event:*:podcast-program:*:*';
    const client = this.cacheService.getClient();
    let cursor = '0';

    do {
      const scanResult = await client.scan(cursor, 'MATCH', pattern, 'COUNT', batchSize);
      cursor = scanResult[0];
      const keys = scanResult[1];
      const progressInfoList = [];

      for (const key of keys) {
        const valueString = await client.get(key);
        if (!valueString) continue;

        const [, memberId, , podcastProgramId, createdAtString] = key.split(':');
        const createdAtTimestamp = parseInt(createdAtString, 10);
        const createdAtDate = new Date(createdAtTimestamp);

        const value = JSON.parse(valueString);
        progressInfoList.push({
          key,
          memberId,
          podcastProgramId,
          progress: value?.progress,
          lastProgress: value?.lastProgress,
          podcastAlbumId: value?.podcastAlbumId,
          created_at: createdAtDate,
        });
      }

      progressInfoList.sort((a, b) => a.created_at.getTime() - b.created_at.getTime());

      if (progressInfoList.length > 0) {
        try {
          await this.podcastService.processPodcastProgramProgress(progressInfoList, manager);
          await client.del(...progressInfoList.map((info) => info.key));
        } catch (error) {
          console.error('Batch saving failed:', error);
          for (const progressInfo of progressInfoList) {
            try {
              await this.podcastService.processPodcastProgramProgress([progressInfo], manager);
            } catch (innerError) {
              console.error(
                `Saving progress for ${progressInfo.key} , value ${JSON.stringify(progressInfo)} failed:`,
                innerError,
              );
            }
            await client.del(progressInfo.key);
          }
        }
      }
    } while (cursor !== '0');
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
