import { EntityManager } from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';

import { AppSetting } from '~/app/entity/app_setting.entity';
import { TableLog } from '~/table_log/table_log.entity';
import { CacheService } from '~/utility/cache/cache.service';

import { TriggerHandler } from './trigger_handler';

@Injectable()
export class AppSettingHandler extends TriggerHandler<AppSetting> {
  constructor(protected readonly logger: Logger, protected readonly cacheService: CacheService) {
    super(logger);
  }

  protected handleInsert(tableLog: TableLog, manager: EntityManager): Promise<Record<string, any>> {
    return Promise.resolve({});
  }

  protected async handleUpdate(tableLog: TableLog, manager: EntityManager): Promise<Record<string, any>> {
    const newData = tableLog.new;
    const { app_id: appId } = newData;
    await this.clearCache(appId);
    return { message: 'clear cache successfully' };
  }

  protected async handleDelete(tableLog: TableLog, manager: EntityManager): Promise<Record<string, any>> {
    const oldData = tableLog.old;
    const { app_id: appId } = oldData;
    await this.clearCache(appId);
    return { message: 'clear cache successfully' };
  }

  private async clearCache(appId: string): Promise<void> {
    await this.cacheService.getClient().del(`app:${appId}:settings`);
  }
}
