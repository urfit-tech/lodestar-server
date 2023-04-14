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
      const acquiredUuids = await redisCli.keys(`lock:${key}:*`);

      if (acquiredUuids.length === 0) {
        if (expireTime === undefined) {
          await redisCli.set(`lock:${key}:${acquirerUuid}`, acquirerUuid);
        } else {
          await redisCli.set(
            `lock:${key}:${acquirerUuid}`, acquirerUuid, 'PX', expireTime,
          );
        }
        return true;
      } else if (acquiredUuids.includes(`lock:${key}:${acquirerUuid}`)) {
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
      const touchedLocks = await redisCli.touch(`lock:${key}:${toucherUuid}`);
      return touchedLocks > 0;
    } catch {
      return false;
    }
  }

  async releaseLock(key: string, releaserUuid: string): Promise<boolean> {
    try {
      const redisCli = this.cacheService.getClient();
      const releasedLocks = await redisCli.del(`lock:${key}:${releaserUuid}`);
      return releasedLocks > 0;
    } catch {
      return false;
    }
  }
}
