import { isObject } from 'lodash';
import { Inject, Injectable } from '@nestjs/common';

import { CacheService } from '../cache/cache.service';

@Injectable()
export class DistributedLockService {
  constructor(@Inject('KEY') private readonly key: string, private readonly cacheService: CacheService) {}

  async occupyLock(
    identityKey: string | undefined,
    inputValue: string | number | Buffer | Object,
    expireTime: number,
  ): Promise<void> {
    const redisCli = this.cacheService.getClient();
    const key = `lock:${this.key}${identityKey ? `:${identityKey}` : ''}`;
    const value = isObject(inputValue) ? JSON.stringify(inputValue) : inputValue;

    const setResult = await redisCli.set(key, value, 'PX', expireTime, 'NX');
    if (setResult === null) {
      throw new Error(
        `Lock [${key}] with ${identityKey ? `identity[${identityKey}]` : ''} value[${value}] is unable to acquired.`,
      );
    }
  }

  async releaseLock(identityKey: string | undefined): Promise<void> {
    const key = `lock:${this.key}${identityKey ? `:${identityKey}` : ''}`;
    const redisCli = this.cacheService.getClient();
    await redisCli.del(key);
  }
}
