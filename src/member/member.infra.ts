import { EntityManager, FindOptionsWhere, OrderByCondition, In } from 'typeorm';
import { Cursor, buildPaginator } from 'typeorm-cursor-pagination';
import { Injectable } from '@nestjs/common';
import { MemberProperty } from './entity/member_property.entity';
import { Member } from './entity/member.entity';
import { MemberAuditLog } from './entity/member_audit_log.entity';
import { first, keys, omit, pick, values } from 'lodash';
import { MemberPropertiesCondition } from './member.dto';

@Injectable()
export class MemberInfrastructure {
  async getSimpleMemberByConditions(
    appId: string,
    conditions: FindOptionsWhere<Member>,
    order: OrderByCondition,
    prevToken: string | undefined,
    nextToken: string | undefined,
    limit = 10,
    entityManager: EntityManager,
  ): Promise<{ data: Array<Member>; cursor: Cursor }> {
    let queryBuilder = entityManager.getRepository(Member).createQueryBuilder('member');

    if (conditions.manager || conditions.managerId) {
      queryBuilder = queryBuilder.leftJoinAndSelect('member.manager', 'manager');
    }

    if (conditions.memberProperties) {
      const memberPropertyQueryBuilder = await this._getMemberPropertyQueryBuilderByCondition(
        entityManager,
        conditions,
      );
      queryBuilder = queryBuilder.innerJoinAndSelect(
        `(${memberPropertyQueryBuilder.getSql()})`,
        'memberProperty',
        '"memberProperty"."mid"::text = "member"."id"',
      );

      conditions = omit(conditions, ['memberProperties']);
    }

    queryBuilder = queryBuilder
      .where({
        appId,
        ...conditions,
      })
      .orderBy(Object.keys(order).reduce((prev, current) => ((prev[`member.${current}`] = order[current]), prev), {}));

    const paginator = buildPaginator({
      entity: Member,
      paginationKeys: ['createdAt', 'id'],
      query: {
        limit,
        order: 'DESC',
        afterCursor: nextToken,
        beforeCursor: prevToken,
      },
    });
    return paginator.paginate(queryBuilder);
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
    manager: EntityManager,
  ) {
    const memberAuditLogRepo = manager.getRepository(MemberAuditLog);

    return Promise.allSettled(
      invokers.map((invoker) => {
        const toInsert = new MemberAuditLog();
        toInsert.memberId = invoker.id;
        toInsert.target = target;
        toInsert.action = action;

        return memberAuditLogRepo.save(toInsert);
      }),
    );
  }

  private _getMemberPropertyQueryBuilderByCondition(
    entityManager: EntityManager,
    conditions: FindOptionsWhere<Member>,
  ) {
    const memberPropertyConditions = pick(conditions, ['memberProperties'])
      .memberProperties as MemberPropertiesCondition[];
    const sqlCondition = memberPropertyConditions
      .map((property) => {
        const key = first(keys(property));
        const value = first(values(property));
        return `("property_id" = '${key}' AND "value" ILIKE '${value}')`;
      })
      .join(' OR ');

    const queryBuilder = entityManager
      .getRepository(MemberProperty)
      .createQueryBuilder('memberProperty')
      .select('member_id as mid')
      .where(`(${sqlCondition})`)
      .groupBy('member_id')
      .having(`COUNT(property_id) = ${memberPropertyConditions.length}`);

    return queryBuilder;
  }
}
