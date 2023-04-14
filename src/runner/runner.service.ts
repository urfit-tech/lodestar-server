import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';

import { DistributeLockService } from '~/utility/lock/distribute_lock.service';

import { Runner } from './runner';

@Injectable()
export class RunnerService implements OnModuleInit, OnModuleDestroy {
  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly distributeLockService: DistributeLockService,
    private readonly runner: Runner,
  ) {}

  onModuleInit(): void {
    const interval = setInterval(
      async () => {
        const lock = await this.distributeLockService.acquireLock(
          this.runner.getName(),
          this.runner.getUuid(),
          this.runner.getInterval() + 60000,
        );

        if (lock === true) {
          await this.runner.run();
          await this.distributeLockService.touchLock(
            this.runner.getName(),
            this.runner.getUuid(),
          );
        } else {
          console.error(`Lock is unacquirable for ${this.runner.getName()}`);
        }
      }, this.runner.getInterval(),
    );
    this.schedulerRegistry.addInterval(this.runner.getName(), interval);
  }

  async onModuleDestroy(): Promise<void> {
    await this.distributeLockService.releaseLock(
      this.runner.getName(),
      this.runner.getUuid(),
    );
  }
}
