import { Injectable } from '@nestjs/common/decorators';
import { EntityManager } from 'typeorm';
import { Token } from '~/entity/Token';

@Injectable()
export class TokenInfrastructure {
  async getGiftById(giftId: string, manager: EntityManager) {
    return manager.getRepository(Token).findOne({ where: { id: giftId } });
  }
}
