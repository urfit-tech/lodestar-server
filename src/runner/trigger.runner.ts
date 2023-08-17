import { EntityManager } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';
import { DynamicModule, Injectable, Logger } from '@nestjs/common';

import { TriggerModule } from '~/trigger/trigger.module';
import { TriggerService } from '~/trigger/trigger.service';
import { DistributedLockService } from '~/utility/lock/distributed_lock.service';
import { ShutdownService } from '~/utility/shutdown/shutdown.service';

import { Runner } from './runner';

@Injectable()
export class TriggerRunner extends Runner {
  private readonly batchSize: number;

  static forRoot(): DynamicModule {
    return {
      module: TriggerRunner,
      imports: [TriggerModule],
    };
  }

  constructor(
    protected readonly logger: Logger,
    protected readonly distributedLockService: DistributedLockService,
    protected readonly shutdownService: ShutdownService,
    private readonly triggerService: TriggerService,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {
    super(
      TriggerRunner.name,
      60 * 1000,
      logger,
      distributedLockService,
      shutdownService,
    );
    this.batchSize = 100;
  }

  async execute(entityManager?: EntityManager): Promise<void> {
    const cb = async (manager: EntityManager) => {
      return this.triggerService.processTriggerThroughTableLog(
        this.batchSize, manager,
      );
    };
    return entityManager ? cb(entityManager) : this.entityManager.transaction(cb);
  }
}
