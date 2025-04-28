import { Injectable } from '@nestjs/common';
import { CoinImportResultDTO } from './coin.dto';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { CoinCsvHeaderMapping } from './class/csvHeaderMapping';
import { ValidationError } from 'class-validator';
import { CoinLog } from '~/entity/CoinLog';
import { CsvRawCoin } from './class/csvRawCoin';
import dayjs from 'dayjs';
import { v4 } from 'uuid';
import { Member } from '~/member/entity/member.entity';

@Injectable()
export class CoinService {
  constructor(@InjectEntityManager() private readonly entityManager: EntityManager) {}

  async rawCsvToCoinLog(
    appId: string,
    headerInfos: CoinCsvHeaderMapping,
    rawRows: Array<Record<string, string>>,
    entityManager: EntityManager,
  ): Promise<Array<[CoinLog | null, Array<ValidationError>]>> {
    const coinLogs: Array<[CoinLog | null, Array<ValidationError>]> = [];

    const deserialized = rawRows.map(rawRow => new CsvRawCoin().deserializedFromCsvRawRow(headerInfos, rawRow));

    for (const [eachRow, errors] of deserialized) {
      const coinLog = new CoinLog();
      if (errors.length > 0) {
        coinLogs.push([null, errors]);
        continue;
      }

      const inDbMember = await entityManager.getRepository(Member).findOne({
        where: { appId, email: eachRow.email },
      });

      if (!inDbMember) {
        coinLogs.push([
          null,
          [
            {
              target: { email: eachRow.email, title: eachRow.title },
              property: 'email',
              constraints: { memberNotFound: 'member not found' },
            },
          ],
        ]);
        continue;
      }
      coinLog.id = v4();
      coinLog.memberId = inDbMember.id;
      coinLog.title = eachRow.title;
      coinLog.amount = parseFloat(eachRow.amount);
      coinLog.note = eachRow.note || null;
      coinLog.description = eachRow.description || '';
      coinLog.startedAt = !eachRow.startedAt
        ? null
        : dayjs(eachRow.startedAt).isValid && dayjs(eachRow.startedAt).toDate();
      coinLog.endedAt = !eachRow.endedAt ? null : dayjs(eachRow.endedAt).isValid() && dayjs(eachRow.endedAt).toDate();
      coinLog.claimedAt = !eachRow.claimedAt
        ? null
        : dayjs(eachRow.claimedAt).isValid() && dayjs(eachRow.claimedAt).toDate();
      coinLog.createdAt = !eachRow.createdAt
        ? dayjs().toDate()
        : dayjs(eachRow.createdAt).isValid() && dayjs(eachRow.createdAt).toDate();

      coinLogs.push([coinLog, errors]);
    }

    return coinLogs;
  }

  async processImportFromFile(appId: string, rawRows: Array<Record<string, any>>): Promise<CoinImportResultDTO> {
    const [headerInfos, headerErrors] = new CoinCsvHeaderMapping().deserializeFromRaw(rawRows.shift());
    if (headerErrors.length > 0) {
      return {
        toInsertCount: rawRows.length,
        insertedCount: 0,
        failedCount: rawRows.length,
        failedErrors: headerErrors,
      };
    }
    const rawDeserializeResult = await this.rawCsvToCoinLog(appId, headerInfos, rawRows, this.entityManager);
    const coinLogToImport = rawDeserializeResult.filter(([_, errors]) => errors.length === 0);
    const deserializationFailed = rawDeserializeResult.filter(([_, errors]) => errors.length !== 0);

    const results = await Promise.allSettled(
      coinLogToImport.map(([coinLog]) => {
        return this.entityManager.transaction(async manager => {
          try {
            const coinLogRepo = manager.getRepository(CoinLog);
            await coinLogRepo.save(coinLog);
          } catch (error) {
            throw new Error(
              JSON.stringify({
                memberId: coinLog.memberId,
                error: error.message,
              }),
            );
          }
        });
      }),
    );
    const fulfilleds = results.filter(result => result.status === 'fulfilled');
    const rejecteds: Array<any> = (
      results.filter(result => result.status === 'rejected') as Array<PromiseRejectedResult>
    ).map(({ reason }) => (reason instanceof Error ? reason.message : JSON.stringify(reason)));
    deserializationFailed
      .map(([_, errors]) => errors)
      .forEach(errors => {
        const acc = {};
        errors.forEach(({ target, property, value, constraints }) => {
          const { email, title } = target as CsvRawCoin;
          const identity = `${email}/${title}`;

          if (acc[identity] === undefined) {
            acc[identity] = [];
          }

          acc[identity].push({ property, value, constraints });
        });
        rejecteds.push(acc);
      });

    return {
      toInsertCount: rawDeserializeResult.length,
      insertedCount: fulfilleds.length,
      failedCount: rejecteds.length,
      failedErrors: rejecteds,
    };
  }
}
