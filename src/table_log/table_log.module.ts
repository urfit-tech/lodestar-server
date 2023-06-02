import { EntityManager } from 'typeorm';
import { Module, Logger, OnModuleInit } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';

import { TriggerModule } from '~/trigger/trigger.module';

import { TableLogService } from './table_log.service';

@Module({
  providers: [Logger, TableLogService],
})
export class TableLogModule implements OnModuleInit {
  constructor(
    private readonly logger: Logger,
    private readonly tableLogService: TableLogService,
    @InjectEntityManager('phdb') private entityManager: EntityManager,
  ) {}

  async onModuleInit() {
    await this.entityManager.transaction(async (manager: EntityManager) => {
      await this.tableLogService.initTableLogPgFunction(manager);
      await TriggerModule.initializeTriggerInDB(this.logger, this.tableLogService, manager);
    });
  }
}
