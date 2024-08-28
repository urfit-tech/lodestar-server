import { Injectable, OnApplicationShutdown, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnApplicationShutdown {
  private readonly cacheRedisUri: string;
  private client: Redis;
  private readonly logger = new Logger(CacheService.name);

  constructor(private readonly configService: ConfigService<{ CACHE_REDIS_URI: string }>) {
    this.cacheRedisUri = configService.getOrThrow('CACHE_REDIS_URI');
    this.client = new Redis(this.cacheRedisUri);
    this.client.client('SETNAME', 'lodestar-server');
  }

  public getClient() {
    return this.client;
  }

  public async checkRedisConnection(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      this.logger.log(`Redis connected successfully: ${result}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to connect to Redis:', error);
      return false;
    }
  }

  async onApplicationShutdown() {
    await this.client.quit();
  }
}
