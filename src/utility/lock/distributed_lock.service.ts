import { Inject, Injectable } from '@nestjs/common';

import { CacheService } from '../cache/cache.service';

@Injectable()
export class DistributedLockService {
  constructor(
    @Inject('KEY') private readonly key: string,
    private readonly cacheService: CacheService,
  ) {}

  async acquireLock(
    acquirerUuid: string, expireTime?: number,
  ): Promise<boolean> {
    try {
      const redisCli = this.cacheService.getClient();
      const previousAcquired = await redisCli.get(`lock:${this.key}`);

      if (previousAcquired === null) {
        if (expireTime === undefined) {
          await redisCli.set(`lock:${this.key}`, acquirerUuid, 'NX');
        } else {
          await redisCli.set(
            `lock:${this.key}`, acquirerUuid, 'PX', expireTime, 'NX',
          );
        }
        return true;
      } else if (previousAcquired === acquirerUuid) {
        await this.touchLock(acquirerUuid);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async touchLock(toucherUuid: string): Promise<boolean> {
    try {
      const redisCli = this.cacheService.getClient();
      const acquirerUuid = await redisCli.get(`lock:${this.key}`);
      if (acquirerUuid === toucherUuid) {
        const touchedLocks = await redisCli.touch(`lock:${this.key}`);
        return touchedLocks > 0;
      } else {
        return false;
      }
    } catch {
      return false;
    }
  }

  async releaseLock(releaserUuid: string): Promise<boolean> {
    try {
      const redisCli = this.cacheService.getClient();
      const acquirerUuid = await redisCli.get(`lock:${this.key}`);
      if (acquirerUuid === releaserUuid) {
        const releasedLocks = await redisCli.del(`lock:${this.key}`);
        return releasedLocks > 0;
      } else {
        return false;
      }
    } catch {
      return false;
    }
  }
}
