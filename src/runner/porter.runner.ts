import { DynamicModule, Injectable, Logger } from '@nestjs/common';

import { DistributedLockService } from '~/utility/lock/distributed_lock.service';
import { ShutdownService } from '~/utility/shutdown/shutdown.service';

import { Runner } from './runner';
import { CacheService } from '~/utility/cache/cache.service';
import axios from 'axios';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager, FindOperator, LessThan } from 'typeorm';
import { ProgramContentLog } from '~/program/entity/ProgramContentLog';
import { MemberService } from '~/member/member.service';
import { ProgramService } from '~/program/program.service';
import { PodcastService } from '~/podcast/podcast.service';
import { PodcastProgressInfo } from '~/podcast/podcast.types';
import { PorterProgramService } from '~/program/porter-program.service';
import { ProgramInfrastructure } from '~/program/program.infra';
import { MemberInfrastructure } from '~/member/member.infra';
import dayjs from 'dayjs';
import { MemberNote } from '~/entity/MemberNote';
import { Member } from '~/member/entity/member.entity';

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
    private readonly memberInfra: MemberInfrastructure,

    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {
    super(PorterRunner.name, 5 * 60 * 1000, logger, distributedLockService, shutdownService);
  }

  async portLastLoggedIn(manager: EntityManager, batchSize = 1000): Promise<void> {
    let cursor = '0';
    do {
      const reply = await this.cacheService.getClient().scan(cursor, 'MATCH', 'last-logged-in:*', 'COUNT', batchSize);
      cursor = reply[0];
      const keys = reply[1];

      if (keys.length === 0) {
        console.warn('No last logged in member keys found');
        break;
      }

      const timestamps = await this.cacheService.getClient().mget(keys);

      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const [, memberId] = key.split(':');
        const loginedAt = timestamps[i];

        try {
          await this.memberService.updateMemberLoginDate(memberId, new Date(loginedAt), manager);
          await this.cacheService.getClient().del(key);
        } catch (error) {
          console.error(`porting ${key} failed:`, error);
          await this.cacheService.getClient().del(key);
        }
      }
    } while (cursor !== '0');
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

    const isValidUrl = (url) => {
      try {
        new URL(url);
        return true;
      } catch (_) {
        return false;
      }
    };

    if (heartbeatUrl && typeof heartbeatUrl === 'string' && isValidUrl(heartbeatUrl)) {
      console.log('Calling heartbeat URL:', heartbeatUrl);
      await axios.get(heartbeatUrl);
    } else {
      console.log(`Invalid or no heartbeat URL set, skipping call: ${heartbeatUrl}`);
    }
  }

  async portPhoneServiceInsertEvent(manager: EntityManager, batchSize = 1000): Promise<void> {
    type LastMemberNotesType = {
      criteria: {
        id: any;
        appId: string;
      };
      lastMemberRecord: {
        lastMemberNoteAnswered?: string | undefined;
        lastMemberNoteCalled?: string | undefined;
        lastMemberNoteCreated: string;
      };
    };

    type ErrInfoType = {
      memberNote: { data: MemberNote[]; errMsg: string } | 'NoError';
      member: { data: LastMemberNotesType; errMsg: string } | 'NoError';
    };

    type ErrorLogType = {
      key: string;
      date: string;
      info: ErrInfoType | 'No data found' | 'Data format error';
    };

    type redisDataType = {
      key?: string;
      memberNotes: MemberNote[];
      lastMemberNotes: LastMemberNotesType;
    };

    const hasRedisDataProperty = (data: redisDataType): boolean => {
      return Boolean(
        data.hasOwnProperty('lastMemberNotes') &&
          data.lastMemberNotes?.hasOwnProperty('criteria') &&
          data.lastMemberNotes?.hasOwnProperty('lastMemberRecord') &&
          data.hasOwnProperty('memberNotes'),
      );
    };

    const createErrorLog = (key: string): ErrorLogType => {
      const dateTime = key.split(':')[1];
      const errorLog: ErrorLogType = {
        key,
        date: `${new Date(parseInt(dateTime, 10))}`,
        info: {
          memberNote: 'NoError',
          member: 'NoError',
        },
      };
      return errorLog;
    };

    const client = this.cacheService.getClient();
    const pattern = `PhoneService:*`;
    let cursor = '0';

    do {
      const scanResult = await client.scan(cursor, 'MATCH', pattern, 'COUNT', batchSize);
      cursor = scanResult[0];
      const keys = scanResult[1];
      const redisDataArray: redisDataType[] = [];
      const errorLogs: ErrorLogType[] = [];

      // handle data from redis
      for (const key of keys) {
        const valueString = await client.get(key);

        if (!valueString) {
          const errorLog = createErrorLog(key);
          errorLog.info = 'No data found';
          errorLogs.push(errorLog);
          continue;
        }
        const data: redisDataType = JSON.parse(valueString);

        if (!hasRedisDataProperty(data)) {
          const errorLog = createErrorLog(key);
          errorLog.info = 'Data format error';
          errorLogs.push(errorLog);
          continue;
        }

        data.key = key;
        redisDataArray.push(data);
      }

      // save data to DB
      await Promise.all(
        redisDataArray.map(
          async (data) =>
            await manager.transaction(async (manager) => {
              try {
                const { memberNotes, lastMemberNotes, key } = data;
                const { criteria, lastMemberRecord } = lastMemberNotes;
                let errorLog = createErrorLog(key);

                try {
                  await this.memberInfra.insertData<MemberNote>(memberNotes, MemberNote, manager);
                } catch (error) {
                  errorLog = {
                    ...errorLog,
                    info: {
                      member: (errorLog.info as Pick<ErrInfoType, 'member'>).member,
                      memberNote: { data: memberNotes, errMsg: error.toString() },
                    },
                  };
                }
                try {
                  await this.memberInfra.updateData<Member>(criteria, lastMemberRecord, Member, manager);
                } catch (error) {
                  errorLog = {
                    ...errorLog,
                    info: {
                      member: { data: lastMemberNotes, errMsg: error.toString() },
                      memberNote: (errorLog.info as Pick<ErrInfoType, 'memberNote'>).memberNote,
                    },
                  };
                }

                if (
                  typeof errorLog.info !== 'string' &&
                  (typeof errorLog.info.member !== 'string' || typeof errorLog.info.memberNote !== 'string')
                ) {
                  errorLogs.push(errorLog);
                }

                await client.del(key);
              } catch (error) {
                // Data rollback
                throw new Error(`Encountered an issue while handling member or memberNote data: ${error.message}`);
              }
            }),
        ),
      );

      if (errorLogs.length > 0) {
        for (const errorItem of errorLogs) {
          console.error(`Saving phone service failed:${errorItem}`);
        }
      }
      redisDataArray.length = 0;
      errorLogs.length = 0;
    } while (cursor !== '0');
  }

  async execute(entityManager?: EntityManager): Promise<void> {
    console.time('Total Execution Time');
    const currentTime = dayjs().format('YYYY-MM-DD HH:mm:ss');
    console.log(`start porter runner ${currentTime}`);
    await this.checkAndCallHeartbeat();

    const errors: any[] = [];

    const handlePorting = async (taskName: string, taskFunction: () => Promise<void>) => {
      const taskStartTime = currentTime;
      console.time(`Task Time [${taskStartTime}] - ${taskName}`);
      try {
        console.log(`porting ${taskName} at ${taskStartTime}`);
        await taskFunction();
        console.log(`finishing porting ${taskName}`);
      } catch (error) {
        console.error(`port ${taskName} failed at ${taskStartTime}:`, error);
        errors.push(error);
      }
      console.timeEnd(`Task Time [${taskStartTime}] - ${taskName}`);
    };

    await handlePorting('last logged in', () => this.portLastLoggedIn(this.entityManager));
    await handlePorting('player event', () => this.portPlayerEvent(this.entityManager));
    await handlePorting('podcast event', () => this.portPodcastProgram(this.entityManager));
    await handlePorting('phone service event', () => this.portPhoneServiceInsertEvent(this.entityManager));

    if (errors.length > 0) {
      console.error(errors, 'Porting errors occurred');
    }

    console.timeEnd('Total Execution Time');
  }
}
