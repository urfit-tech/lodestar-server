import { EntityManager } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';

import { Program } from '~/entity/Program';
import { OrderLog } from '~/order/entity/order_log.entity';
import dayjs from 'dayjs';

@Injectable()
export class ProgramPackageService {
  constructor(@InjectEntityManager() private readonly entityManager: EntityManager) {}

  async getProgramPackageByMemberId(memberId: string) {
    return;
  }

  async getExpiredProgramPackageByMemberId(memberId: string) {
    return;
  }
}
