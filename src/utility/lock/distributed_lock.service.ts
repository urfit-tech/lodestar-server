import { Inject, Injectable } from '@nestjs/common';

import { CacheService } from '../cache/cache.service';

@Injectable()
export class DistributedLockService {
  constructor(
    @Inject('KEY') private readonly key: string,
    private readonly cacheService: CacheService,
  ) {}

  async acquireLock(
    identityKey: string,
    value: string | number | Buffer,
    expireTime: number,
  ): Promise<void> {
    const redisCli = this.cacheService.getClient();
    const key = `lock:${this.key}:${identityKey}`;
    
    const setResult = await redisCli.set(key, value, 'PX', expireTime, 'NX');
    if (setResult === null) {
      throw new Error(
        `Lock [${key}] with identity [${identityKey}] is unable to acquired.`
      );
    }
  }

  async releaseLock(identityKey: string): Promise<void> {
    const key = `lock:${this.key}:${identityKey}`;
    const redisCli = this.cacheService.getClient();
    const inRedisValue = await redisCli.exists(key);

    if (inRedisValue === null) {
      throw new Error(`Lock ${key} not exists.`);
    }

    await redisCli.del(key);
  }
}
