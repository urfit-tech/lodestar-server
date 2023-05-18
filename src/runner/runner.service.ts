import dayjs from 'dayjs';
import { Inject, Injectable, OnModuleDestroy, OnModuleInit, Optional } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';

import { APIException } from '~/api.excetion';

import { Runner } from './runner';

@Injectable()
export class RunnerService implements OnModuleInit, OnModuleDestroy {
  constructor(
    @Optional() @Inject('NO_GO') private readonly noGo: boolean | undefined,
    private readonly schedulerRegistry: SchedulerRegistry,
    public readonly runner: Runner,
  ) {}

  async healthz(): Promise<string> {
    const now = dayjs().toDate();
    const previousExecutedTime = this.runner.getPreviousExecutedTime();
    const runnerInterval = this.runner.getInterval();

    if (!previousExecutedTime) {
      return 'not execute yet';
    } else if (now.getTime() - previousExecutedTime.getTime() > runnerInterval) {
      throw new APIException({ code: 'E_HEALTHZ', message: 'Runner is hang...' }, 500);
    }
    return previousExecutedTime.toISOString();
  }

  onModuleInit(): void {
    if (this.noGo) { return; }

    const interval = setInterval(
      async () => this.runner.run(), this.runner.getInterval(),
    );
    this.schedulerRegistry.addInterval(this.runner.getName(), interval);
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.noGo) {
      this.schedulerRegistry.deleteInterval(this.runner.getName());
    }
  }
}
