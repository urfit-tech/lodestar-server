import { Inject, Injectable } from '@nestjs/common';

import { CacheService } from '../cache/cache.service';

@Injectable()
export class DistributedLockService {
  constructor(
    @Inject('KEY') private readonly key: string,
    @Inject('MAX_HOLDER_AMOUNT') private readonly maxHolderAmount: number,
    private readonly cacheService: CacheService,
  ) {}

  async acquireLock(
    identityKey: string,
    value: string | number | Buffer,
    expireTime: number,
    options?: { subKey: string },
  ): Promise<void> {
    const redisCli = this.cacheService.getClient();
    const key = `lock:${this.key}${options ? `:${options.subKey}` : ''}`;
    const inRedisKeys = await redisCli.keys(`${key}:*`);
    
    if (inRedisKeys.length >= this.maxHolderAmount) {
      throw new Error(
        `Lock [${key}] with identity [${identityKey}] is unable to acquired.`
      );
    }
    await redisCli.set(`${key}:${identityKey}`, value, 'PX', expireTime, 'NX');
  }

  async releaseLock(
    identityKey: string, options?: { subKey: string; },
  ): Promise<void> {
    const key = `lock:${this.key}${options ? `:${options.subKey}` : ''}:${identityKey}`;
    const redisCli = this.cacheService.getClient();
    const inRedisValue = await redisCli.exists(key);

    if (inRedisValue === null) {
      throw new Error(`Lock ${key} not exists.`);
    }

    await redisCli.del(key);
  }
}
