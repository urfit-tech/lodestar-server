import dayjs from 'dayjs';
import { v4 } from 'uuid';
import { EntityManager } from 'typeorm';
import { Logger } from '@nestjs/common';

import { DistributedLockService } from '~/utility/lock/distributed_lock.service';
import { ShutdownService } from '~/utility/shutdown/shutdown.service';
import { getMemoryUsageString } from '~/utils';

export abstract class Runner {
  public readonly uuid: string;
  protected readonly name: string;
  protected readonly interval: number;
  protected readonly logger: Logger;
  protected readonly lockService: DistributedLockService;
  protected readonly shutdownService: ShutdownService;
  protected previousExecutedTime: Date;

  constructor(
    name: string,
    interval: number,
    logger: Logger,
    lockService: DistributedLockService,
    shutdownService: ShutdownService,
  ) {
    this.uuid = v4();
    this.name = name;
    this.interval = interval;
    this.logger = logger;
    this.lockService = lockService;
    this.shutdownService = shutdownService;
  }

  abstract execute(manager?: EntityManager): Promise<void>;

  async run(): Promise<void> {
    this.preRun();
    let isCompleted = false;
    try {
      await this.lockService.occupyLock(
        this.uuid, dayjs().toDate().getTime(), this.interval * 2,
      );

      const suicideTimeout = setTimeout(
        () => !isCompleted && this.suicide(),
        this.interval * 1.1,
      );

      try {
        await this.execute();
        isCompleted = true;
      } catch (err) {
        this.logger.error(err);
      }
      await this.lockService.releaseLock(this.uuid);
      clearTimeout(suicideTimeout);
      this.previousExecutedTime = dayjs().toDate();
    } catch {
      return;
    } finally {
      this.postRun();
    }
  }

  getName(): string {
    return this.name;
  }

  getInterval(): number {
    return this.interval;
  }

  getPreviousExecutedTime(): Date {
    return this.previousExecutedTime;
  }

  private preRun(): void {
    this.logger.log(getMemoryUsageString());
  }

  private postRun(): void {
    this.logger.log('Runner execution finished');
    this.logger.log(getMemoryUsageString());
  }

  private async suicide() {
    try {
      this.logger.error('Runner timeout exceed, suicide...');
      await this.lockService.releaseLock(this.uuid);
    } catch (err) {
      this.logger.error(`SuicideError: ${err}`);
    } finally {
      this.logger.error(`Shutdown ${this.uuid}`);
      this.shutdownService.shutdown();
    }
  }
}
