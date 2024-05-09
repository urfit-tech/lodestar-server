import { EntityManager, FindOptionsWhere, SelectQueryBuilder } from "typeorm";
import { Member } from "../entity/member.entity";
import { MemberProperty } from "../entity/member_property.entity";
import { first, keys, pick, values } from "lodash";
import { MemberPropertiesCondition } from "~/member/member.dto";
import { MemberPermissionGroup } from "../entity/member_permission_group.entity";
import { MemberCategory } from "../entity/member_category.entity";
import { MemberTag } from "../entity/member_tag.entity";
import { MemberPhone } from "../entity/member_phone.entity";

class MemberManagerObserver implements QueryObserver {
  update(entityManager: EntityManager, queryBuilder: SelectQueryBuilder<Member>, conditions: FindOptionsWhere<Member>): void {
    if (conditions.manager || conditions.managerId) {
      queryBuilder.leftJoinAndSelect('member.manager', 'manager');
    }
  }
}

class MemberPhoneObserver implements QueryObserver {
  async update(entityManager: EntityManager, queryBuilder: SelectQueryBuilder<Member>, conditions: FindOptionsWhere<Member>): Promise<void> {
    if (conditions.memberPhones) {
      const memberPhoneQueryBuilder = await this.getMemberPhoneQueryBuilderByCondition(entityManager, conditions);
      queryBuilder.innerJoinAndSelect(
        `(${memberPhoneQueryBuilder.getSql()})`,
        'memberPhone',
        '"memberPhone"."mid"::text = "member"."id"',
      );
    }
  }

  private async getMemberPhoneQueryBuilderByCondition(entityManager: EntityManager, conditions: FindOptionsWhere<Member>): Promise<SelectQueryBuilder<MemberPhone>> {
    const memberPhoneConditions = pick(conditions, ['memberPhones']).memberPhones as FindOptionsWhere<MemberPhone>;
    const sqlCondition = `("phone" ILIKE '${memberPhoneConditions.phone}')`;
    return entityManager
      .getRepository(MemberPhone)
      .createQueryBuilder('memberPhone')
      .select('member_id as mid')
      .where(`(${sqlCondition})`)
      .groupBy('member_id');
  }
}

class MemberTagObserver implements QueryObserver {
  async update(entityManager: EntityManager, queryBuilder: SelectQueryBuilder<Member>, conditions: FindOptionsWhere<Member>): Promise<void> {
    if (conditions.memberTags) {
      const memberTagQueryBuilder = await this.getMemberTagQueryBuilderByCondition(entityManager, conditions);
      queryBuilder.innerJoinAndSelect(
        `(${memberTagQueryBuilder.getSql()})`,
        'memberTag',
        '"memberTag"."mid"::text = "member"."id"',
      );
    }
  }

  private async getMemberTagQueryBuilderByCondition(entityManager: EntityManager, conditions: FindOptionsWhere<Member>): Promise<SelectQueryBuilder<MemberTag>> {
    const memberTagsConditions = pick(conditions, ['memberTags']).memberTags as FindOptionsWhere<MemberTag>;
    const sqlCondition = `("tag_name" ILIKE '${memberTagsConditions.tagName}')`;
    return entityManager
      .getRepository(MemberTag)
      .createQueryBuilder('memberTag')
      .select('member_id as mid')
      .where(`(${sqlCondition})`);
  }
}

class MemberCategoryObserver implements QueryObserver {
  async update(entityManager: EntityManager, queryBuilder: SelectQueryBuilder<Member>, conditions: FindOptionsWhere<Member>): Promise<void> {
    if (conditions.memberCategories) {
      const memberCategoriesQueryBuilder = await this.getMemberCategoryBuilderByCondition(entityManager, conditions);
      queryBuilder.innerJoinAndSelect(
        `(${memberCategoriesQueryBuilder.getSql()})`,
        'memberCategory',
        '"memberCategory"."mid"::text = "member"."id"',
      );
    }
  }

  private async getMemberCategoryBuilderByCondition(entityManager: EntityManager, conditions: FindOptionsWhere<Member>): Promise<SelectQueryBuilder<MemberCategory>> {
    const memberCategoriesConditions = pick(conditions, ['memberCategories']).memberCategories as any;
    const sqlCondition = `("name" ILIKE '${memberCategoriesConditions.category.name}')`;
    return entityManager
      .getRepository(MemberCategory)
      .createQueryBuilder('memberCategory')
      .leftJoinAndSelect('memberCategory.category', 'category')
      .select('member_id as mid')
      .where(`(${sqlCondition})`);
  }
}

class MemberPermissionGroupObserver implements QueryObserver {
  async update(entityManager: EntityManager, queryBuilder: SelectQueryBuilder<Member>, conditions: FindOptionsWhere<Member>): Promise<void> {
    if (conditions.memberPermissionGroups) {
      const memberPermissionGroupQueryBuilder = await this.getMemberPermissionsGroupBuilderByCondition(entityManager, conditions);
      queryBuilder.innerJoinAndSelect(
        `(${memberPermissionGroupQueryBuilder.getSql()})`,
        'memberPermissionGroup',
        '"memberPermissionGroup"."mid"::text = "member"."id"',
      );
    }
  }

  private async getMemberPermissionsGroupBuilderByCondition(entityManager: EntityManager, conditions: FindOptionsWhere<Member>): Promise<SelectQueryBuilder<MemberPermissionGroup>> {
    const memberPermissionGroupsConditions = pick(conditions, ['memberPermissionGroups']).memberPermissionGroups as any;
    const sqlCondition = `("name" = '${memberPermissionGroupsConditions.permissionGroup.name}')`;
    return entityManager
      .getRepository(MemberPermissionGroup)
      .createQueryBuilder('memberPermissionGroup')
      .leftJoinAndSelect('memberPermissionGroup.permissionGroup', 'permissionGroup')
      .select('member_id as mid')
      .where(`(${sqlCondition})`);
  }
}

class MemberPropertyObserver implements QueryObserver {
  async update(entityManager: EntityManager, queryBuilder: SelectQueryBuilder<Member>, conditions: FindOptionsWhere<Member>): Promise<void> {
    if (conditions.memberProperties) {
      const memberPropertyQueryBuilder = await this.getMemberPropertyQueryBuilderByCondition(entityManager, conditions);
      queryBuilder.innerJoinAndSelect(
        `(${memberPropertyQueryBuilder.getSql()})`,
        'memberProperty',
        '"memberProperty"."mid"::text = "member"."id"',
      );
    }
  }

  private async getMemberPropertyQueryBuilderByCondition(entityManager: EntityManager, conditions: FindOptionsWhere<Member>): Promise<SelectQueryBuilder<MemberProperty>> {
    const memberPropertyConditions = pick(conditions, ['memberProperties']).memberProperties as MemberPropertiesCondition[];
    const sqlCondition = memberPropertyConditions
      .map((property) => {
        const key = first(keys(property));
        const value = first(values(property));
        return `("property_id" = '${key}' AND "value" ILIKE '${value}')`;
      })
      .join(' OR ');

    return entityManager
      .getRepository(MemberProperty)
      .createQueryBuilder('memberProperty')
      .select('member_id as mid')
      .where(`(${sqlCondition})`)
      .groupBy('member_id')
      .having(`COUNT(property_id) = ${memberPropertyConditions.length}`);
  }
}


export {MemberManagerObserver ,  MemberPhoneObserver, MemberTagObserver , MemberCategoryObserver, MemberPermissionGroupObserver , MemberPropertyObserver}