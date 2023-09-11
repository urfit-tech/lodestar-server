import { EntityManager, FindOptionsWhere, OrderByCondition, In } from 'typeorm';
import { Cursor, buildPaginator } from 'typeorm-cursor-pagination';
import { Injectable } from '@nestjs/common';
import { MemberProperty } from './entity/member_property.entity';
import { Member } from './entity/member.entity';
import { MemberAuditLog } from './entity/member_audit_log.entity';
import { first, keys, omit, pick, values } from 'lodash';
import { MemberPropertiesCondition } from './member.dto';
import { MemberPhone } from './entity/member_phone.entity';
import { MemberTag } from './entity/member_tag.entity';
import { MemberCategory } from './entity/member_category.entity';
import { MemberPermissionGroup } from '~/member/entity/member_permission_group.entity';

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

    if (conditions.memberPhones) {
      const memberPhoneQueryBuilder = await this.getMemberPhoneQueryBuilderByCondition(entityManager, conditions);
      queryBuilder = queryBuilder.innerJoinAndSelect(
        `(${memberPhoneQueryBuilder.getSql()})`,
        'memberPhone',
        '"memberPhone"."mid"::text = "member"."id"',
      );
      conditions = omit(conditions, ['memberPhones']);
    }

    if (conditions.memberTags) {
      const memberTagQueryBuilder = await this.getMemberTagQueryBuilderByCondition(entityManager, conditions);
      queryBuilder = queryBuilder.innerJoinAndSelect(
        `(${memberTagQueryBuilder.getSql()})`,
        'memberTag',
        '"memberTag"."mid"::text = "member"."id"',
      );
      conditions = omit(conditions, ['memberTags']);
    }

    if (conditions.memberCategories) {
      const memberCategoriesQueryBuilder = await this.getMemberCategoryBuilderByCondition(entityManager, conditions);
      queryBuilder = queryBuilder.innerJoinAndSelect(
        `(${memberCategoriesQueryBuilder.getSql()})`,
        'memberCategory',
        '"memberCategory"."mid"::text = "member"."id"',
      );
      conditions = omit(conditions, ['memberCategories']);
    }

    if (conditions.memberPermissionGroups) {
      const memberPermissionGroupQueryBuilder = await this.getMemberPermissionsGroupBuilderByCondition(
        entityManager,
        conditions,
      );
      queryBuilder = queryBuilder.innerJoinAndSelect(
        `(${memberPermissionGroupQueryBuilder.getSql()})`,
        'memberPermissionGroup',
        '"memberPermissionGroup"."mid"::text = "member"."id"',
      );
      conditions = omit(conditions, ['memberPermissionGroups']);
    }

    if (conditions.memberProperties) {
      const memberPropertyQueryBuilder = await this.getMemberPropertyQueryBuilderByCondition(entityManager, conditions);
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

  private getMemberPropertyQueryBuilderByCondition(entityManager: EntityManager, conditions: FindOptionsWhere<Member>) {
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

  private getMemberPhoneQueryBuilderByCondition(entityManager: EntityManager, conditions: FindOptionsWhere<Member>) {
    const memberPhoneConditions = pick(conditions, ['memberPhones']).memberPhones as FindOptionsWhere<MemberPhone>;
    const sqlCondition = `("phone" ILIKE '${memberPhoneConditions.phone}')`;
    const queryBuilder = entityManager
      .getRepository(MemberPhone)
      .createQueryBuilder('memberPhone')
      .select('member_id as mid')
      .where(`(${sqlCondition})`)
      .groupBy('member_id');

    return queryBuilder;
  }

  private getMemberTagQueryBuilderByCondition(entityManager: EntityManager, conditions: FindOptionsWhere<Member>) {
    const memberTagsConditions = pick(conditions, ['memberTags']).memberTags as FindOptionsWhere<MemberTag>;
    const sqlCondition = `("tag_name" ILIKE '${memberTagsConditions.tagName}')`;
    const queryBuilder = entityManager
      .getRepository(MemberTag)
      .createQueryBuilder('memberTag')
      .select('member_id as mid')
      .where(`(${sqlCondition})`);

    return queryBuilder;
  }

  private getMemberCategoryBuilderByCondition(entityManager: EntityManager, conditions: FindOptionsWhere<Member>) {
    const memberCategoriesConditions = pick(conditions, ['memberCategories']).memberCategories as any;
    const sqlCondition = `("name" ILIKE '${memberCategoriesConditions.category.name}')`;
    const queryBuilder = entityManager
      .getRepository(MemberCategory)
      .createQueryBuilder('memberCategory')
      .leftJoinAndSelect('memberCategory.category', 'category')
      .select('member_id as mid')
      .where(`(${sqlCondition})`);

    return queryBuilder;
  }

  private getMemberPermissionsGroupBuilderByCondition(
    entityManager: EntityManager,
    conditions: FindOptionsWhere<Member>,
  ) {
    const memberPermissionGroupsConditions = pick(conditions, ['memberPermissionGroups']).memberPermissionGroups as any;
    const sqlCondition = `("name" ILIKE '${memberPermissionGroupsConditions.permissionGroup.name}')`;
    const queryBuilder = entityManager
      .getRepository(MemberPermissionGroup)
      .createQueryBuilder('memberPermissionGroup')
      .leftJoinAndSelect('memberPermissionGroup.permissionGroup', 'permissionGroup')
      .select('member_id as mid')
      .where(`(${sqlCondition})`);

    return queryBuilder;
  }
}
