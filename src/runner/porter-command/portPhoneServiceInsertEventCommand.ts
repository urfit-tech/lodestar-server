import { CacheService } from '~/utility/cache/cache.service';
import { EntityManager, In } from 'typeorm';
import { MemberNote } from '~/entity/MemberNote';
import { MemberInfrastructure } from '~/member/member.infra';
import { Member } from '~/member/entity/member.entity';
import { PorterCommand } from './porterCommandInterface';
import dayjs from 'dayjs';

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

class PortPhoneServiceInsertEventCommand implements PorterCommand {
  constructor(private readonly memberInfra: MemberInfrastructure, private readonly cacheService: CacheService) {}

  public async execute(manager: EntityManager, batchSize = 1000): Promise<void> {
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
          async data =>
            await manager.transaction(async manager => {
              try {
                const { lastMemberNotes, key } = data;
                const memberNotes = data.memberNotes
                  ? data.memberNotes.map(note => {
                      const memberNote = new MemberNote();
                      memberNote.authorId = note?.authorId || '';
                      memberNote.metadata = note?.metadata || null;
                      memberNote.duration = note?.duration || 0;
                      memberNote.memberId = note?.memberId || '';
                      memberNote.status = note?.status;
                      memberNote.type = note?.type;
                      memberNote.createdAt = dayjs(note?.createdAt).isValid()
                        ? dayjs(note.createdAt).toDate()
                        : new Date();
                      return memberNote;
                    })
                  : null;
                const {
                  criteria: { id, appId },
                  lastMemberRecord: { lastMemberNoteCreated, lastMemberNoteCalled, lastMemberNoteAnswered },
                } = lastMemberNotes;
                let errorLog = createErrorLog(key);

                try {
                  await this.memberInfra.insertData(memberNotes, manager);
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
                  await this.memberInfra.updateData<Member>(
                    { id: In(id), appId },
                    {
                      lastMemberNoteCreated: lastMemberNoteCreated && new Date(lastMemberNoteCreated),
                      lastMemberNoteCalled: lastMemberNoteCalled && new Date(lastMemberNoteCalled),
                      lastMemberNoteAnswered: lastMemberNoteAnswered && new Date(lastMemberNoteAnswered),
                    },
                    Member,
                    manager,
                  );
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
          console.error(`Saving phone service failed:${JSON.stringify(errorItem)}`);
        }
      }
      redisDataArray.length = 0;
      errorLogs.length = 0;
    } while (cursor !== '0');
  }
}

export { PortPhoneServiceInsertEventCommand };
