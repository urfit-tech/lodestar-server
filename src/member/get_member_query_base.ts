import { EntityManager, FindOptionsWhere, OrderByCondition, SelectQueryBuilder } from "typeorm";
import { Member } from "./entity/member.entity";
import { first, keys, omit, pick, values } from "lodash";
import { MemberPermissionGroup } from "./entity/member_permission_group.entity";
import { MemberCategory } from "./entity/member_category.entity";
import { MemberTag } from "./entity/member_tag.entity";
import { MemberPhone } from "./entity/member_phone.entity";
import { MemberProperty } from "./entity/member_property.entity";
import { MemberPropertiesCondition } from "./member.dto";

class MemberQueryBase {
  async execute(
    appId: string,
    conditions: FindOptionsWhere<Member>,
    order: OrderByCondition,
    entityManager: EntityManager,
  ): Promise<any> {
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

    return queryBuilder;
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
    const sqlCondition = `("name" = '${memberPermissionGroupsConditions.permissionGroup.name}')`;
    const queryBuilder = entityManager
      .getRepository(MemberPermissionGroup)
      .createQueryBuilder('memberPermissionGroup')
      .leftJoinAndSelect('memberPermissionGroup.permissionGroup', 'permissionGroup')
      .select('member_id as mid')
      .where(`(${sqlCondition})`);

    return queryBuilder;
  }

}

export { MemberQueryBase }