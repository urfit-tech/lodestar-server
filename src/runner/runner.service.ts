import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';

import { Runner } from './runner';

@Injectable()
export class RunnerService implements OnModuleInit, OnModuleDestroy {
  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly runner: Runner,
  ) {}

  onModuleInit(): void {
    const interval = setInterval(
      async () => this.runner.run(), this.runner.getInterval(),
    );
    this.schedulerRegistry.addInterval(this.runner.getName(), interval);
  }

  async onModuleDestroy(): Promise<void> {
    await this.runner.revoke();
  }
}
