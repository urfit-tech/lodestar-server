import dayjs from 'dayjs';
import { EntityManager, In, LessThanOrEqual } from 'typeorm';
import { Injectable } from '@nestjs/common';

import { TableLog } from '~/table_log/table_log.entity';

import { TriggerLog } from './entity/trigger_log.entity';
import { AppSettingHandler } from './handler/app_setting.handler';
import { AppSecretHandler } from './handler/app_secret.handler';
import { AppHostHandler } from './handler/app_host.handler';

@Injectable()
export class TriggerService {
  constructor(
    private readonly appSettingHandler: AppSettingHandler,
    private readonly appSecretHandler: AppSecretHandler,
    private readonly appHostHandler: AppHostHandler,
  ) {}

  public async processTriggerThroughTableLog(
    limit: number, manager: EntityManager,
  ): Promise<void> {
    const triggerLogRepo = manager.getRepository(TriggerLog);
    const tableLogRepo = manager.getRepository(TableLog);
    const triggerLog = await triggerLogRepo.findOne({
      where: {},
      order: { createdAt: 'DESC' },
    });
    const lastTriggerExecutedAt = triggerLog ? triggerLog.createdAt : dayjs.utc().toDate();
    const tableLogs = await tableLogRepo.find({
      where: {
        tableName: In(['app_setting', 'app_secret', 'app_host']),
        createdAt: LessThanOrEqual(lastTriggerExecutedAt),
      },
      take: limit,
    });

    for (const tableLog of tableLogs) {
      const { tableName } = tableLog;
      await manager.transaction(async (entityManager: EntityManager) => {
        switch (tableName) {
          case 'app_setting':
            return this.appSettingHandler.handler(tableLog, entityManager);
          case 'app_secret':
            return this.appSecretHandler.handler(tableLog, entityManager);
          case 'app_host':
            return this.appHostHandler.handler(tableLog, entityManager);
        }
      });
    }
  }
}
