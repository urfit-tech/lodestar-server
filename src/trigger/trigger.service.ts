import { EntityManager } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';

import { APIException } from '~/api.excetion';
import { TableLog } from '~/entity/TableLog.mongo';
import { CacheService } from '~/utility/cache/cache.service';

import { HasuraTrigger, HasuraTriggerEvent } from './trigger.type';

@Injectable()
export class TriggerService {
  constructor(
    private readonly cacheService: CacheService,
    @InjectEntityManager('ldb') private readonly ldbManager: EntityManager,
  ) {}

  public async handleHasuraTrigger(data: HasuraTrigger): Promise<any> {
    const { trigger, event } = data;

    if (event === 'recache') {
      await this.cacheService.getClient().del(data.key!);
    }

    const { name: triggerName } = trigger;
    switch (triggerName) {
      case 'table_log':
        return this.handleTriggerTableLog(event);
      default:
        throw new APIException({
          code: '400',
          message: `Unknown trigger name: ${triggerName}`,
          result: null,
        });
    }
  }

  private async handleTriggerTableLog(event: HasuraTriggerEvent): Promise<void> {
    const { op, data } = event;
    const { new: newData, old: oldData } = data;
    const tableLogRepo = this.ldbManager.getMongoRepository(TableLog);

    const tableLogToSave = new TableLog();
    tableLogToSave.operation = op;
    tableLogToSave.new = newData;
    tableLogToSave.old = oldData;
    tableLogToSave.insertedAt = new Date();

    await tableLogRepo.save(tableLogToSave);
  }
}