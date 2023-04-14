import { Injectable, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';

import { ExampleRunner } from './example.runner';
import { Runner } from './runner';

@Injectable()
export class RunnerService  implements OnModuleInit {
  private readonly runners: Array<Runner>;

  constructor(
    private schedulerRegistry: SchedulerRegistry,
    private readonly exampleRunner: ExampleRunner,
  ) {
    this.runners = [exampleRunner];
  }

  onModuleInit() {
    this.runners.forEach((runner: Runner) => {
      const interval = setInterval(() => runner.run(), runner.getInterval());
      this.schedulerRegistry.addInterval(runner.getName(), interval);
    });
  }
}
