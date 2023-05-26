import { EntityManager, In } from 'typeorm';
import { Injectable } from '@nestjs/common';

import { MemberProperty } from './entity/member_property.entity';

@Injectable()
export class MemberInfrastructure {
  async getMemberPropertiesByIds(memberId: string, propertyIds: Array<string>, manager: EntityManager) {
    const memberPropertyRepo = manager.getRepository(MemberProperty);
    const founds = await memberPropertyRepo.find({
      where: { id: In(propertyIds), memberId },
    });
    return founds;
  }
}
