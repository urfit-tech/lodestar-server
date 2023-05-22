import { EntityManager } from 'typeorm';
import { Logger, Module } from '@nestjs/common';

import { CacheService } from '~/utility/cache/cache.service';
import { TableLogService } from '~/table_log/table_log.service';
import { TableOperation } from '~/table_log/table_log.type';
import { TableLogModule } from '~/table_log/table_log.module';

import { TriggerService } from './trigger.service';
import { AppSettingHandler } from './handler/app_setting.handler';
import { AppSecretHandler } from './handler/app_secret.handler';

@Module({
  imports: [TableLogModule],
  providers: [
    Logger,
    TriggerService,
    CacheService,
    AppSettingHandler,
    AppSecretHandler,
  ],
  exports: [TriggerService],
})
export class TriggerModule {
  static async initializeTriggerInDB(
    logger: Logger, tableLogService: TableLogService, manager: EntityManager,
  ): Promise<void> {
    const tables = ['app_setting', 'app_secret'];
    for (const tableName of tables) {
      for (const operation of ['INSERT', 'UPDATE', 'DELETE']) {
        const existence = await tableLogService.isTableTriggerExists(
          tableName, operation as TableOperation, manager,
        );
        if(!existence) {
          await tableLogService.createTableTrigger(tableName, operation as TableOperation, manager);
        }
      }
    }
  }
}
