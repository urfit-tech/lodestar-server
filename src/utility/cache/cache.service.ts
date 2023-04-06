import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config';

import Redis from 'ioredis'

@Injectable()
export class CacheService {
  private readonly cacheRedisUri: string;
  private client: Redis
  
  constructor(
    private readonly configService: ConfigService<{ CACHE_REDIS_URI: string }>,
  ) {
    this.cacheRedisUri = configService.getOrThrow('CACHE_REDIS_URI');
    this.client = new Redis(this.cacheRedisUri);
  }

  public getClient() {
    return this.client;
  }
}
