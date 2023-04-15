import { Injectable } from '@nestjs/common';

import { CacheService } from '../cache/cache.service';

@Injectable()
export class DistributeLockService {
  constructor(
    private cacheService: CacheService,
  ) {}

  async acquireLock(
    key: string, acquirerUuid: string, expireTime?: number,
  ): Promise<boolean> {
    try {
      const redisCli = this.cacheService.getClient();
      const previousAcquired = await redisCli.get(`lock:${key}`);

      if (previousAcquired === null) {
        if (expireTime === undefined) {
          await redisCli.set(`lock:${key}`, acquirerUuid, 'NX');
        } else {
          await redisCli.set(
            `lock:${key}`, acquirerUuid, 'PX', expireTime, 'NX',
          );
        }
        return true;
      } else if (previousAcquired === acquirerUuid) {
        await this.touchLock(key, acquirerUuid);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async touchLock(key: string, toucherUuid: string): Promise<boolean> {
    try {
      const redisCli = this.cacheService.getClient();
      const acquirerUuid = await redisCli.get(`lock:${key}`);
      if (acquirerUuid === toucherUuid) {
        const touchedLocks = await redisCli.touch(`lock:${key}`);
        return touchedLocks > 0;
      } else {
        return false;
      }
    } catch {
      return false;
    }
  }

  async releaseLock(key: string, releaserUuid: string): Promise<boolean> {
    try {
      const redisCli = this.cacheService.getClient();
      const acquirerUuid = await redisCli.get(`lock:${key}`);
      if (acquirerUuid === releaserUuid) {
        const releasedLocks = await redisCli.del(`lock:${key}`);
        return releasedLocks > 0;
      } else {
        return false;
      }
    } catch {
      return false;
    }
  }
}
