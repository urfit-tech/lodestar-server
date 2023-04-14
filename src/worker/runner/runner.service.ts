import { Injectable, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';

import { Runner } from './runner';

@Injectable()
export class RunnerService  implements OnModuleInit {
  constructor(
    private schedulerRegistry: SchedulerRegistry,
    private readonly runner: Runner,
  ) {}

  onModuleInit() {
    const interval = setInterval(
      () => this.runner.run(), this.runner.getInterval(),
    );
    this.schedulerRegistry.addInterval(this.runner.getName(), interval);
  }
}
