import { EntityManager } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';

import { PgTrigger, TableOperation } from './table_log.type';
import CheckTableTrigger from './sql/check_table_trigger';
import CreateOrReplaceFunctionTableLog from './sql/create_or_replace_func_table';
import CreateOrReplaceTrigger from './sql/create_or_replace_trigger';

@Injectable()
export class TableLogService {
  constructor(
    @InjectEntityManager('phdb') private readonly entityManager: EntityManager,
  ) {}

  public async initTableLogPgFunction(entityManager?: EntityManager): Promise<void> {
    const manager = entityManager || this.entityManager;
    await manager.query(CreateOrReplaceFunctionTableLog);
  }

  public async isTableTriggerExists(
    tableName: string, operation: TableOperation, entityManager?: EntityManager,
  ): Promise<boolean> {
    const manager = entityManager || this.entityManager;
    const result: Array<PgTrigger> = await manager.query(
      CheckTableTrigger(tableName, operation),
    );
    const lodestarTriggers = result.filter(
      ({ trigger_name }) => trigger_name.startsWith('lodestar_'),
    );
    return lodestarTriggers.length != 0;
  }

  public async createTableTrigger(
    tableName: string, operation: TableOperation, entityManager?: EntityManager,
  ): Promise<void> {
    const manager = entityManager || this.entityManager;
    await manager.query(CreateOrReplaceTrigger(tableName, operation));
  }
}
