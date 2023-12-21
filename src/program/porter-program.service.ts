import { Injectable, Inject } from '@nestjs/common';
import { EntityManager, In } from 'typeorm';
import { CacheService } from '~/utility/cache/cache.service';
import { ProgramContent } from '~/program/entity/program_content.entity';
import { ProgramContentLog } from '~/program/entity/ProgramContentLog';
import { validate as uuidValidate } from 'uuid';

@Injectable()
export class PorterProgramService {
  constructor(private readonly cacheService: CacheService) {}

  async scanCacheForKeys(pattern: string, batchSize: number, cursor: string): Promise<[string, string[]]> {
    const client = this.cacheService.getClient();
    const scanResult = await client.scan(cursor, 'MATCH', pattern, 'COUNT', batchSize);
    return [scanResult[0], scanResult[1]];
  }

  async fetchValuesFromCache(keys: string[]): Promise<string[]> {
    const client = this.cacheService.getClient();
    return client.mget(keys);
  }

  parseKeyValuePairs(keys: string[], values: string[]): any[] {
    return keys
      .map((key, index) => {
        const valueString = values[index];
        if (!valueString) return null;

        const [, memberId, , programContentId, createdAtString] = key.split(':');
        return { key, memberId, programContentId, createdAtString, valueString };
      })
      .filter((item) => item !== null);
  }

  async fetchProgramContents(ids: string[], entityManager: EntityManager): Promise<Map<string, ProgramContent>> {
    return this.findProgramContentsByIds(ids, entityManager);
  }

  createProgramContentLogs(keyValuePairs: any[], programContentsMap: Map<string, ProgramContent>): ProgramContentLog[] {
    return keyValuePairs
      .map(({ memberId, programContentId, createdAtString, valueString }) => {
        const createdAtTimestamp = parseInt(createdAtString, 10);
        const createdAtDate = new Date(createdAtTimestamp);
        const value = JSON.parse(valueString);
        const programContent = programContentsMap.get(programContentId);

        if (!programContent) {
          console.error(`Processing failed: Program content not found for ID ${programContentId}`);
          return null;
        }

        const programContentLog = new ProgramContentLog();
        programContentLog.memberId = memberId;
        programContentLog.programContent = programContent;
        programContentLog.playbackRate = value.playbackRate || 1;
        programContentLog.startedAt = value.startedAt || 0;
        programContentLog.endedAt = value.endedAt || 0;
        programContentLog.createdAt = createdAtDate;

        return programContentLog;
      })
      .filter((log) => log !== null);
  }

  async saveProgramContentLogs(programContentLogs: ProgramContentLog[], entityManager: EntityManager): Promise<void> {
    await entityManager.save(ProgramContentLog, programContentLogs);
  }

  async deleteProcessedKeysFromCache(keys: string[]): Promise<void> {
    const client = this.cacheService.getClient();
    await client.del(...keys);
  }

  async handleBatchSaveFailure(
    programContentLogs: ProgramContentLog[],
    keys: string[],
    manager: EntityManager,
  ): Promise<void> {
    for (let i = 0; i < programContentLogs.length; i++) {
      try {
        await this.saveProgramContentLogs([programContentLogs[i]], manager);
      } catch (innerError) {
        console.error(`Saving log failed: ${innerError}`);
      }
      await this.deleteProcessedKeysFromCache([keys[i]]);
    }
  }

  public async findProgramContentsByIds(
    ids: string[],
    entityManager: EntityManager,
  ): Promise<Map<string, ProgramContent>> {
    const programContentRepo = entityManager.getRepository(ProgramContent);

    const validIds = ids.filter((id) => uuidValidate(id));

    if (validIds.length === 0) {
      return new Map<string, ProgramContent>();
    }

    const programContents = await programContentRepo.findBy({ id: In(validIds) });
    const programContentMap = new Map<string, ProgramContent>();
    programContents.forEach((pc) => programContentMap.set(pc.id, pc));
    return programContentMap;
  }
}
