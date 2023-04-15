import { v4 } from 'uuid';

import { DistributeLockService } from '~/utility/lock/distribute_lock.service';

export abstract class Runner {
  public readonly uuid: string;
  protected readonly name: string;
  protected isCompleted: boolean;
  protected readonly interval: number;
  protected readonly lockService: DistributeLockService;

  constructor(
    name: string,
    interval: number,
    lockService: DistributeLockService,
  ) {
    this.uuid = v4();
    this.name = name;
    this.isCompleted = true;
    this.interval = interval;
    this.lockService = lockService;
  }

  abstract execute(): Promise<void>;

  async run(): Promise<void> {
    const isAcquiredLock = await this.lockService.acquireLock(
      this.name, this.uuid, this.interval + 60000,
    );

    if (isAcquiredLock === false) {
      console.error(`Unable to acquire lock for ${this.name}:${this.uuid}`);
    } else if (this.isCompleted === false) {
      console.error('Previous execution is not completed yet');
      return;
    }
    
    try {
      this.isCompleted = false;
      await this.execute();
      await this.lockService.touchLock(this.name, this.uuid);
    } catch (err) {
      console.error(err);
    } finally {
      this.isCompleted = true;
    }
  }

  async revoke(): Promise<void> {
    await this.lockService.releaseLock(this.name, this.uuid);
  }

  getName(): string {
    return this.name;
  }

  getInterval(): number {
    return this.interval;
  }
}
