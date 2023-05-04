import { v4 } from 'uuid';

import { DistributedLockService } from '~/utility/lock/distributed_lock.service';

export abstract class Runner {
  public readonly uuid: string;
  protected readonly name: string;
  protected readonly interval: number;
  protected readonly lockService: DistributedLockService;
  protected previousExecutedTime: Date;

  constructor(
    name: string,
    interval: number,
    lockService: DistributedLockService,
  ) {
    this.uuid = v4();
    this.name = name;
    this.interval = interval;
    this.lockService = lockService;
  }

  abstract execute(): Promise<void>;

  async run(): Promise<void> {
    const internalKillTimeout = setTimeout(
      async () => {
        try {
          await this.lockService.releaseLock(this.uuid, { subKey: this.name });
        } catch (err) {
          console.log(err);
        } finally {
          process.exit(1);
        }
      }, this.interval * 1.1,
    );
    
    try {
      await this.lockService.acquireLock(
        this.uuid,
        new Date().getTime(),
        this.interval * 2,
        { subKey: this.name },
      );
      await this.execute();
      await this.lockService.releaseLock(
        this.uuid, { subKey: this.name },
      );
      clearTimeout(internalKillTimeout);
      this.previousExecutedTime = new Date();
    } catch (err) {
      console.error(err);
    }
  }

  async revoke(): Promise<void> {
    try {
      await this.lockService.releaseLock(this.uuid, { subKey: this.name });
    } catch (err) {
      console.error(err);
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
}
