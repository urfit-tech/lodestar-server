import { Logger } from '@nestjs/common';
import dayjs from 'dayjs';
import { EntityManager } from 'typeorm';

import { TableLog } from '~/table_log/table_log.entity';
import { TriggerLog } from '~/trigger/entity/trigger_log.entity';

export abstract class TriggerHandler<T> {
  protected readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  async handler(tableLog: TableLog, manager: EntityManager) {
    const { tableName, new: newData, old: oldData } = tableLog;
    this.logger.log(`Handling ${tableName} trigger handler`);

    if (oldData === null) {
      const insertResult = await this.handleInsert(tableLog, manager);
      return this.log(tableLog, insertResult, manager);
    } else if (newData === null) {
      const deleteResult = await this.handleDelete(tableLog, manager);
      return this.log(tableLog, deleteResult, manager);
    } else {
      const updateResult = await this.handleUpdate(tableLog, manager);
      return this.log(tableLog, updateResult, manager);
    }
  }

  private async log(tableLog: TableLog, result: Record<string, any>, manager: EntityManager) {
    const triggerLogRepo = manager.getRepository(TriggerLog);
    const triggerLog = new TriggerLog();

    triggerLog.tableLog = tableLog;
    triggerLog.result = result;
    triggerLog.createdAt = dayjs.utc().toDate();

    return triggerLogRepo.save(triggerLog);
  }

  protected abstract handleInsert(tableLog: TableLog, manager: EntityManager): Promise<Record<string, any>>;
  
  protected abstract handleUpdate(tableLog: TableLog, manager: EntityManager): Promise<Record<string, any>>;

  protected abstract handleDelete(tableLog: TableLog, manager: EntityManager): Promise<Record<string, any>>;
}