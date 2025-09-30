import { EntityManager } from 'typeorm';

import { Card } from './entity/Card';
type CardType = import('./entity/Card').Card;

export class CardInfrastructure {
  //   constructor() {}
  async getMembershipCards(manager: EntityManager): Promise<CardType[]> {
    const cards = await manager.getRepository(Card).createQueryBuilder('card').select(['id', '']);
    return [];
  }
}
