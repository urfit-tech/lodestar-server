import dayjs from 'dayjs';
import { EntityManager } from 'typeorm';
import { Injectable } from '@nestjs/common'
import { InjectEntityManager } from '@nestjs/typeorm';

import { APIException } from './api.excetion';
import { CacheService } from './utility/cache/cache.service'

@Injectable()
export class ApplicationService {
  constructor(
    private cacheService: CacheService,
    @InjectEntityManager('phdb') private entityManager: EntityManager,
  ) {}

  async healthz(): Promise<string> {
    try {
      await Promise.all([
        this.cacheService.getClient().ping(),
        this.entityManager.query('SELECT 1'),
      ]);
      return dayjs().toISOString();
    } catch (error) {
      throw new APIException({ code: 'E_HEALTHZ', message: null, result: error }, 500);
    }
  }
}
