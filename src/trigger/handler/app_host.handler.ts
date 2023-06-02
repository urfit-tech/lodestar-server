import { EntityManager } from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';

import { AppHost } from '~/app/entity/app_host.entity';
import { TableLog } from '~/table_log/table_log.entity';
import { CacheService } from '~/utility/cache/cache.service';

import { TriggerHandler } from './trigger_handler';

@Injectable()
export class AppHostHandler extends TriggerHandler<AppHost> {
  constructor(
    protected readonly logger: Logger,
    protected readonly cacheService: CacheService,
  ) {
    super(logger);
  }

  protected handleInsert(tableLog: TableLog, manager: EntityManager): Promise<any> {
    return;
  }

  protected async handleUpdate(tableLog: TableLog, manager: EntityManager): Promise<any> {
    const oldData = tableLog.old;
    const { host } = oldData;
    await this.clearCache(host);
    return;
  }

  protected async handleDelete(tableLog: TableLog, manager: EntityManager): Promise<any> {
    const oldData = tableLog.old;
    const { host } = oldData;
    await this.clearCache(host);
    return;
  }

  private async clearCache(host: string): Promise<void> {
    await this.cacheService.getClient().del(`host:${host}`);
  }
}
