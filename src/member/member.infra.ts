import {
  EntityManager,
  FindOptionsWhere,
  OrderByCondition,
  In,
} from 'typeorm';
import { Injectable } from '@nestjs/common';

import { MemberProperty } from './entity/member_property.entity';
import { Member } from './entity/member.entity';
import { MemberAuditLog } from './entity/member_audit_log.entity';

@Injectable()
export class MemberInfrastructure {
  async getSimpleMemberByConditions(
    appId: string,
    conditions: FindOptionsWhere<Member>,
    order: OrderByCondition,
    limit: number,
    entityManager: EntityManager,
  ) {
    let queryBuilder = entityManager
      .getRepository(Member)
      .createQueryBuilder('member');
    
    if (conditions.manager || conditions.managerId) {
      queryBuilder = queryBuilder
        .leftJoinAndSelect('member.manager', 'manager');
    }
    return queryBuilder
      .where({
        appId,
        ...conditions,
      })
      .orderBy(Object
        .keys(order)
        .reduce(
          (prev, current) => (prev[`member.${current}`] = order[current], prev),
          {},
        )
      )
      .limit(limit)
      .getMany();
  }

  async getMembersByConditions(
    appId: string,
    conditions: FindOptionsWhere<Member>,
    entityManager: EntityManager,
  ): Promise<Array<Member>> {
    const memberRepo = entityManager.getRepository(Member);
    return memberRepo.find({
      where: {
        ...conditions,
        app: { id: appId },
      },
      relations: {
        manager: true,
        memberPhones: true,
        memberCategories: {
          category: true,
        },
        memberTags: {
          tagName2: true,
        },
        memberProperties: {
          property: true,
        },
      },
    });
  }

  async getMemberPropertiesByIds(memberId: string, propertyIds: Array<string>, manager: EntityManager) {
    const memberPropertyRepo = manager.getRepository(MemberProperty);
    const founds = await memberPropertyRepo.find({
      where: { id: In(propertyIds), memberId },
    });
    return founds;
  }

  async insertMemberAuditLog(
    invokers: Array<Member>,
    target: string,
    action: 'upload' | 'download',
    manager: EntityManager) {
      const memberAuditLogRepo = manager.getRepository(MemberAuditLog);

      return Promise.allSettled(invokers.map((invoker) => {
        const toInsert = new MemberAuditLog();
        toInsert.memberId = invoker.id;
        toInsert.target = target;
        toInsert.action = action;

        return memberAuditLogRepo.save(toInsert);
      }));
  }
}
