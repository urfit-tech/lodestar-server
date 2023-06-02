import { Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { TableLog } from '~/table_log/table_log.entity';

export abstract class TriggerHandler<T> {
  protected readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  handler(tableLog: TableLog, manager: EntityManager){
    const { tableName, new: newData, old: oldData } = tableLog;
    this.logger.log(`Handling ${tableName} trigger handler`);

    if (oldData === null) {
      return this.handleInsert(tableLog, manager);
    } else if (newData === null) {
      return this.handleDelete(tableLog, manager);
    } else {
      return this.handleUpdate(tableLog, manager);
    }
  }

  protected abstract handleInsert(tableLog: TableLog, manager: EntityManager): Promise<any>;
  
  protected abstract handleUpdate(tableLog: TableLog, manager: EntityManager): Promise<any>;

  protected abstract handleDelete(tableLog: TableLog, manager: EntityManager): Promise<any>;
}