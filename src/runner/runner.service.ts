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
    const runnerInterval = await this.runner.getInterval();

    if (!previousExecutedTime) {
      return 'not execute yet';
    } else if (now.getTime() - previousExecutedTime.getTime() > runnerInterval) {
      throw new APIException({ code: 'E_HEALTHZ', message: 'Runner is hang...' }, 500);
    }
    return previousExecutedTime.toISOString();
  }

  onModuleInit(): void {
    if (this.noGo) {
      return;
    }

    this.scheduleRunner();
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.noGo) {
      this.schedulerRegistry.deleteInterval(this.runner.getName());
    }
  }

  private async scheduleRunner(): Promise<void> {
    const intervalTime = await this.runner.getInterval();
    const runnerName = this.runner.getName();

    if (this.schedulerRegistry.doesExist('interval', runnerName)) {
      this.schedulerRegistry.deleteInterval(runnerName);
    }

    const interval = setInterval(async () => {
      await this.runner.run();
      this.scheduleRunner();
    }, intervalTime);

    this.schedulerRegistry.addInterval(runnerName, interval);
  }
}
