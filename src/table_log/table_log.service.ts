import { EntityManager } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';

import { PgTrigger, TableOperation } from './table_log.type';
import CheckTableTrigger from './sql/check_table_trigger';
import CreateOrReplaceFunctionTableLog from './sql/create_or_replace_func_table';
import CreateOrReplaceTrigger from './sql/create_or_replace_trigger';
import { TableLog } from './table_log.entity';

@Injectable()
export class TableLogService {
  constructor(@InjectEntityManager() private readonly entityManager: EntityManager) {}

  public async initTableLogPgFunction(entityManager?: EntityManager): Promise<void> {
    const manager = entityManager || this.entityManager;
    await manager.query(CreateOrReplaceFunctionTableLog);
  }

  public async isTableTriggerExists(
    tableName: string,
    operation: TableOperation,
    entityManager?: EntityManager,
  ): Promise<boolean> {
    const manager = entityManager || this.entityManager;
    const result: Array<PgTrigger> = await manager.query(CheckTableTrigger(tableName, operation));
    const lodestarTriggers = result.filter(({ trigger_name }) => trigger_name.startsWith('lodestar_'));
    return lodestarTriggers.length != 0;
  }

  public async createTableTrigger(
    tableName: string,
    operation: TableOperation,
    entityManager?: EntityManager,
  ): Promise<void> {
    const manager = entityManager || this.entityManager;
    await manager.query(CreateOrReplaceTrigger(tableName, operation));
  }

  public async insert(
    memberId: string,
    tableName: string,
    data: { old?: any; new?: any },
    entityManager?: EntityManager,
  ): Promise<TableLog> {
    const manager = entityManager || this.entityManager;
    const tableLogRepo = manager.getRepository(TableLog);

    const log = new TableLog();
    log.memberId = memberId;
    log.tableName = tableName;
    log.old = data.old || null;
    log.new = data.new || null;

    return tableLogRepo.save(log);
  }
}
