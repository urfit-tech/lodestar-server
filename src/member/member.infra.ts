import {
  EntityManager,
  FindOptionsWhere,
  OrderByCondition,
  In,
  DeleteResult,
  Equal,
  DeepPartial,
  InsertResult,
  UpdateResult,
  ObjectId,
  EntityTarget,
} from 'typeorm';
import { Cursor, buildPaginator } from 'typeorm-cursor-pagination';
import { Injectable } from '@nestjs/common';
import { first, keys, omit, pick, values } from 'lodash';
import * as uuid from 'uuid';
import { Member } from './entity/member.entity';
import { MemberAuditLog } from './entity/member_audit_log.entity';
import { MemberCategory } from './entity/member_category.entity';
import { MemberDevice } from './entity/member_device.entity';
import { MemberOauth } from './entity/member_oauth.entity';
import { MemberPermission } from './entity/member_permission.entity';
import { MemberPermissionGroup } from './entity/member_permission_group.entity';
import { MemberPhone } from './entity/member_phone.entity';
import { MemberProperty } from './entity/member_property.entity';
import { MemberTag } from './entity/member_tag.entity';
import { MemberPropertiesCondition } from './member.dto';
import { ExecutorInfo, LoginMemberMetadata, DeleteMemberInfo } from './member.type';
import { OrderProduct } from '~/order/entity/order_product.entity';
import { OrderDiscount } from '~/order/entity/order_discount.entity';
import { OrderLog } from '~/order/entity/order_log.entity';
import { Notification } from '~/entity/Notification';
import { PaymentLog } from '~/payment/payment_log.entity';
import { MemberTrackingLog } from '~/entity/MemberTrackingLog';
import { MemberPermissionExtra } from '~/entity/MemberPermissionExtra';
import { Invoice } from '~/invoice/invoice.entity';
import { MemberNote } from '~/entity/MemberNote';
import { MemberTask } from '~/entity/MemberTask';
import { Coupon } from '~/coupon/entity/coupon.entity';
import { ProgramContentProgress } from '~/entity/ProgramContentProgress';
import { ProgramContentLog } from '~/program/entity/ProgramContentLog';
import { Voucher } from '~/voucher/entity/voucher.entity';
import { Exercise } from '~/entity/Exercise';
import { IssueReply } from '~/entity/IssueReply';
import { Issue } from '~/entity/Issue';
import { IssueReaction } from '~/entity/IssueReaction';
import { IssueReplyReaction } from '~/entity/IssueReplyReaction';
import { CommentReply } from '~/entity/CommentReply';
import { CommentReplyReaction } from '~/entity/CommentReplyReaction';
import { CommentReaction } from '~/entity/CommentReaction';
import { Comment } from '~/entity/Comment';
import { MemberCard } from '~/entity/MemberCard';
import { MemberContract } from '~/entity/MemberContract';
import { Review } from '~/entity/Review';
import { ReviewReaction } from '~/entity/ReviewReaction';
import { OrderExecutor } from '~/order/entity/order_executor.entity';
import { OrderContact } from '~/entity/OrderContact';
import { CoinLog } from '~/entity/CoinLog';
import { PodcastProgramProgress } from '~/podcast/entity/PodcastProgramProgress';
import { PostRole } from '~/entity/PostRole';
import { ProgramTempoDelivery } from '~/entity/ProgramTempoDelivery';
import { Practice } from '~/entity/Practice';
import { ProgramTimetable } from '~/entity/ProgramTimetable';
import { Attend } from '~/entity/Attend';
import { ReviewReply } from '~/entity/ReviewReply';
import { Property } from '~/definition/entity/property.entity';
import { Category } from '~/definition/entity/category.entity';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

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

  async getMemberRoleCounts(
    appId: string,
    conditions: FindOptionsWhere<Member>,
    entityManager: EntityManager,
  ): Promise<{ role: string; count: number }[]> {
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
      .select('member.role', 'role')
      .addSelect('COUNT(member.id)', 'count')
      .groupBy('member.role');
  
    const roleCounts = await queryBuilder.getRawMany();
  
    return roleCounts.map(item => ({
      role: item.role,
      count: parseInt(item.count, 10),
    }));
  }

  async getById(appId: string, memberId: string, entityManager: EntityManager): Promise<Member> {
    const memberRepo = entityManager.getRepository(Member);
    return memberRepo.findOneBy({ appId, id: memberId });
  }

  async insertData<T>(
    data: QueryDeepPartialEntity<T> | QueryDeepPartialEntity<T>[],
    table: EntityTarget<T>,
    entityManager: EntityManager,
  ): Promise<InsertResult> {
    const memberRepo = entityManager.getRepository(table);
    return await memberRepo.insert(data);
  }

  async updateData<T>(
    data: string | string[] | number | number[] | Date | Date[] | ObjectId | ObjectId[] | FindOptionsWhere<T>,
    partialEntity: QueryDeepPartialEntity<T>,
    table: EntityTarget<T>,
    entityManager: EntityManager,
  ): Promise<UpdateResult> {
    const memberRepo = entityManager.getRepository(table);
    return memberRepo.update(data, partialEntity);
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

  async getMemberDevices(memberId: string, manager: EntityManager): Promise<Array<MemberDevice>> {
    const memberDeviceRepo = manager.getRepository(MemberDevice);
    const founds = await memberDeviceRepo.findBy({ memberId });
    return founds;
  }

  async getMemberTasks(memberId: string, manager: EntityManager): Promise<Array<MemberTask>> {
    const memberTaskRepo = manager.getRepository(MemberTask);
    const tasks = await memberTaskRepo.findBy({ memberId });
    return tasks;
  }

  async getMemberTasksByManagerId(managerId: string, appId: string, manager: EntityManager): Promise<any> {
    if (!managerId) {
      return [];
    }

    const memberTaskRepo = manager.getRepository(MemberTask);

    const subQuery = manager
      .getRepository(Member)
      .createQueryBuilder('m')
      .select('m.id')
      .where('m.manager_id = :managerId', { managerId })
      .andWhere('m.app_id = :appId', { appId });

    const query = memberTaskRepo
      .createQueryBuilder('mt')
      .where('mt.member_id IN (' + subQuery.getQuery() + ')')
      .select(['mt.memberId', 'mt.status'])
      .setParameters(subQuery.getParameters());

    return await query.getRawMany();
  }

  async getMemberPhonesByManagerId(managerId: string, appId: string, manager: EntityManager): Promise<any> {
    if (!managerId) {
      return [];
    }

    const memberPhoneRepo = manager.getRepository(MemberPhone);

    const subQuery = manager
      .getRepository(Member)
      .createQueryBuilder('m')
      .select('m.id')
      .where('m.manager_id = :managerId', { managerId })
      .andWhere('m.app_id = :appId', { appId });

    const query = memberPhoneRepo
      .createQueryBuilder('mp')
      .where('mp.member_id IN (' + subQuery.getQuery() + ')')
      .select(['mp.memberId', 'mp.phone'])
      .setParameters(subQuery.getParameters());

    return await query.getRawMany();
  }

  async getMemberNotesByManagerId(managerId: string, appId: string, manager: EntityManager): Promise<any> {
    if (!managerId) {
      return [];
    }

    const memberNoteRepo = manager.getRepository(MemberNote);

    const subQuery = manager
      .getRepository(Member)
      .createQueryBuilder('m')
      .select('m.id')
      .where('m.manager_id = :managerId', { managerId })
      .andWhere('m.app_id = :appId', { appId });

    const query = memberNoteRepo
      .createQueryBuilder('mn')
      .where('mn.member_id IN (' + subQuery.getQuery() + ')')
      .setParameters(subQuery.getParameters())
      .select(['mn.memberId', 'mn.description'])
      .andWhere('mn.type IS NULL')
      .orderBy('mn.created_at', 'DESC');

    return await query.getRawMany();
  }

  async getMemberCategoryByManagerId(managerId: string, appId: string, manager: EntityManager): Promise<any> {
    if (!managerId) {
      return [];
    }

    const memberCategoryRepo = manager.getRepository(MemberCategory);

    const subQuery = manager
      .getRepository(Member)
      .createQueryBuilder('m')
      .select('m.id')
      .where('m.manager_id = :managerId', { managerId })
      .andWhere('m.app_id = :appId', { appId });

    const query = memberCategoryRepo
      .createQueryBuilder('mc')
      .innerJoinAndSelect('mc.category', 'c')
      .where('mc.member_id IN (' + subQuery.getQuery() + ')')
      .select(['mc.memberId', 'c.name', 'mc.categoryId'])
      .andWhere('c.app_id = :appId AND  c.class = :class', { appId, class: 'member' })
      .setParameters(subQuery.getParameters());

    return await query.getRawMany();
  }

  async getMemberContractByManagerId(managerId: string, appId: string, manager: EntityManager): Promise<any> {
    if (!managerId) {
      return [];
    }

    const memberContractRepo = manager.getRepository(MemberContract);

    const subQuery = manager
      .getRepository(Member)
      .createQueryBuilder('m')
      .select('m.id')
      .where('m.manager_id = :managerId', { managerId })
      .andWhere('m.app_id = :appId', { appId });

    const query = memberContractRepo
      .createQueryBuilder('mc')
      .where('mc.member_id IN (' + subQuery.getQuery() + ')')
      .select(['mc.memberId', 'mc.agreedAt', 'mc.revokedAt', 'mc.values'])
      .setParameters(subQuery.getParameters())
      .andWhere('mc.agreed_at IS NOT NULL');

    return await query.getRawMany();
  }

  async getMemberPropertyByManagerId(managerId: string, appId: string, manager: EntityManager): Promise<any> {
    if (!managerId) {
      return [];
    }

    const memberPropertyRepo = manager.getRepository(MemberProperty);

    const subQuery = manager
      .getRepository(Member)
      .createQueryBuilder('m')
      .select('m.id')
      .where('m.manager_id = :managerId', { managerId })
      .andWhere('m.app_id = :appId', { appId });

    const query = memberPropertyRepo
      .createQueryBuilder('mp')
      .innerJoinAndSelect('mp.property', 'p', 'p.id = mp.property_id')
      .select(['mp.memberId', 'mp.value', 'p.id', 'p.name'])
      .where('mp.member_id IN (' + subQuery.getQuery() + ')')
      .setParameters(subQuery.getParameters());

    return await query.getRawMany();
  }

  async getLoginMemberMetadata(memberId: string, manager: EntityManager): Promise<Array<LoginMemberMetadata>> {
    const builder = manager
      .createQueryBuilder()
      .select('to_json(array_agg(distinct member_phone.*))', 'phones')
      .addSelect('to_json(array_agg(distinct member_oauth.*))', 'oauths')
      .addSelect('to_json(array_agg(distinct member_permission.*))', 'permissions')
      .from(Member, 'member')
      .leftJoin(MemberPhone, 'member_phone', 'member.id = member_phone.member_id')
      .leftJoin(MemberOauth, 'member_oauth', 'member.id = member_oauth.member_id')
      .leftJoin(MemberPermission, 'member_permission', 'member.id = member_permission.member_id')
      .where(`member.id = '${memberId}'`);

    const datas = await builder.execute();

    return (datas || []).map((data) => {
      const filteredPhones = (data.phones || []).filter((phone) => phone);
      const filteredOauths = (data.oauths || []).filter((oauth) => oauth);
      const filteredPermissions = (data.permissions || []).filter((permission) => permission);

      return {
        phones: filteredPhones,
        oauths: filteredOauths.reduce((accum, v) => {
          accum[v.provider] = {};
          Object.keys(v?.options || {}).forEach((key) => {
            if (key.includes('id')) {
              accum[v.provider][key] = v.options[key];
            }
          });
          return accum;
        }, {} as { [key: string]: any }),
        permissions: filteredPermissions.map((permission) => ({
          memberId: permission.member_id,
          permissionId: permission.permission_id,
        })),
      };
    });
  }

  async getMemberPropertiesByIds(memberId: string, propertyIds: Array<string>, manager: EntityManager) {
    const memberPropertyRepo = manager.getRepository(MemberProperty);
    const founds = await memberPropertyRepo.find({
      where: { id: In(propertyIds), memberId },
    });
    return founds;
  }

  async getGeneralLoginMemberByUsernameOrEmail(
    appId: string,
    usernameOrEmail: string,
    manager: EntityManager,
  ): Promise<Member | null> {
    const memberRepo = manager.getRepository(Member);
    return memberRepo.findOne({
      where: [
        { appId: Equal(appId), username: Equal(usernameOrEmail) },
        { appId: Equal(appId), email: Equal(usernameOrEmail) },
      ],
    });
  }

  async upsertMemberDevice(
    memberId: string,
    fingerPrintId: string,
    options: {
      browser: string;
      osName: string;
      ipAddress: string | null;
      type: string;
      options: Record<string, any>;
    },
    manager: EntityManager,
  ): Promise<MemberDevice> {
    const memberDeviceRepo = manager.getRepository(MemberDevice);
    const found: MemberDevice =
      (await memberDeviceRepo.findOneBy({
        memberId,
        fingerprintId: fingerPrintId,
      })) || memberDeviceRepo.create({ memberId, fingerprintId: fingerPrintId });

    const { browser, osName, ipAddress, type } = options;
    const currentDatetime = new Date();
    found.loginedAt = currentDatetime;
    found.lastLoginAt = currentDatetime;
    found.browser = browser;
    found.osName = osName;
    found.ipAddress = ipAddress;
    found.isLogin = true;
    found.type = type;
    found.options = options;

    return memberDeviceRepo.save(found);
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

  async updateMemberLoginDate(memberId: string, loginedAt: Date, entityManager: EntityManager): Promise<void> {
    const memberRepo = entityManager.getRepository(Member);
    try {
      const updateResult = await memberRepo.update(memberId, { loginedAt });

      if (updateResult?.affected === 0) {
        console.error(`No records updated for memberId: ${memberId}. Member might not exist.`);
      }
    } catch (error) {
      console.error(`Error updating login date for memberId: ${memberId}`, error);
    }
  }

  async logMemberDeletionEventInfo(
    deleteMemberInfo: DeleteMemberInfo,
    executorMemberInfo: ExecutorInfo,
    entityManager: EntityManager,
  ): Promise<MemberAuditLog | null> {
    const memberAuditLogRepo = entityManager.getRepository(MemberAuditLog);
    const memberRepo = entityManager.getRepository(Member);

    try {
      const member = await memberRepo.findOne({
        where: { email: deleteMemberInfo.email, appId: deleteMemberInfo.appId },
      });

      const memberAuditLog = new MemberAuditLog();
      memberAuditLog.memberId = member ? member.id : deleteMemberInfo.id;
      memberAuditLog.action = 'delete';
      memberAuditLog.target = JSON.stringify({
        executorMemberId: executorMemberInfo.memberId,
        executorIpAddress: executorMemberInfo.ipAddress,
        executorDateTime: executorMemberInfo.dateTime,
        deleteMemberEmail: deleteMemberInfo.email,
        executeResult: executorMemberInfo.executeResult,
      });

      await memberAuditLogRepo.save(memberAuditLog);
      return memberAuditLog;
    } catch (error) {
      console.error(`Error when trying to log member action: ${error}`);
      throw error;
    }
  }

  async upsertMemberByEmail(
    appId: string,
    email: string,
    name: string,
    username: string,
    role: string,
    manager: EntityManager,
  ): Promise<Member> {
    const memberRepo = manager.getRepository(Member);
    const existsMember = await memberRepo.findOneBy({ email, appId });
    if (existsMember) {
      existsMember.role = role;
      existsMember.username = username;
      return memberRepo.save(existsMember);
    }
    const member = memberRepo.create({
      id: uuid.v4(),
      appId,
      email,
      name,
      username,
      role,
    });
    return memberRepo.save(member);
  }

  async upsertMemberBy(
    manager: EntityManager,
    data: DeepPartial<Member>,
    by: FindOptionsWhere<Member>,
  ): Promise<Member> {
    const memberRepo = manager.getRepository(Member);
    const existsMember = await memberRepo.findOneBy(by);
    if (existsMember) {
      return memberRepo.save({
        ...existsMember,
        ...data,
      });
    }
    const member = memberRepo.create({
      id: uuid.v4(),
      ...data,
    });
    return memberRepo.save(member);
  }
  async saveMember(manager: EntityManager, member: Member): Promise<Member> {
    const memberRepo = manager.getRepository(Member);
    return memberRepo.save(member);
  }

  async firstMemberByCondition(manager: EntityManager, conditions: FindOptionsWhere<Member>): Promise<Member | null> {
    const memberRepo = manager.getRepository(Member);
    return memberRepo.findOneBy(conditions);
  }

  async upsertMemberProperty(manager: EntityManager, memberId: string, propertyId: string, value: string) {
    const memberPropertyRepo = manager.getRepository(MemberProperty);
    const property = await memberPropertyRepo.findOneBy({
      memberId,
      propertyId,
    });
    if (property) {
      property.value = value;
      return memberPropertyRepo.save(property);
    }

    const memberProperty = memberPropertyRepo.create({
      memberId,
      propertyId,
      value,
    });
    return memberPropertyRepo.save(memberProperty);
  }

  async upsertMemberPhone(manager: EntityManager, memberId: string, phone: string) {
    const memberPhoneRepo = manager.getRepository(MemberPhone);
    const memberPhone = await memberPhoneRepo.findOneBy({
      memberId,
      phone,
    });
    if (memberPhone) {
      return memberPhone;
    }
    const newMemberPhone = memberPhoneRepo.create({
      memberId,
      phone,
    });
    return memberPhoneRepo.save(newMemberPhone);
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

  public async deleteMemberByEmail(appId: string, email: string, entityManager: EntityManager): Promise<DeleteResult> {
    return entityManager.transaction(async (manager) => {
      const memberRepo = manager.getRepository(Member);
      const memberCategoryRepo = manager.getRepository(MemberCategory);
      const memberTagRepo = manager.getRepository(MemberTag);
      const memberOauthRepo = manager.getRepository(MemberOauth);
      const memberDeviceRepo = manager.getRepository(MemberDevice);
      const memberPhoneRepo = manager.getRepository(MemberPhone);
      const memberPropertyRepo = manager.getRepository(MemberProperty);
      const memberPermissionExtraRepo = manager.getRepository(MemberPermissionExtra);
      const memberTrackingLogRepo = manager.getRepository(MemberTrackingLog);
      const memberNoteRepo = manager.getRepository(MemberNote);
      const memberTaskRepo = manager.getRepository(MemberTask);

      const programContentProgressRepo = manager.getRepository(ProgramContentProgress);
      const programContentLogRepo = manager.getRepository(ProgramContentLog);

      const notificationRepo = manager.getRepository(Notification);
      const couponRepo = manager.getRepository(Coupon);
      const paymentLogRepo = manager.getRepository(PaymentLog);
      const invoiceRepo = manager.getRepository(Invoice);
      const orderProductRepo = manager.getRepository(OrderProduct);
      const orderDiscountRepo = manager.getRepository(OrderDiscount);
      const orderLogRepo = manager.getRepository(OrderLog);
      const voucherRepo = manager.getRepository(Voucher);
      const exerciseRepo = manager.getRepository(Exercise);
      const issueReplyRepo = manager.getRepository(IssueReply);
      const issueRepo = manager.getRepository(Issue);
      const issueReactionRepo = manager.getRepository(IssueReaction);
      const issueReplyReactionRepo = manager.getRepository(IssueReplyReaction);
      const commentReplyReactionRepo = manager.getRepository(CommentReplyReaction);
      const commentReplyRepo = manager.getRepository(CommentReply);
      const commentReactionRepo = manager.getRepository(CommentReaction);
      const commentRepo = manager.getRepository(Comment);
      const memberCardRepo = manager.getRepository(MemberCard);
      const memberContractRepo = manager.getRepository(MemberContract);
      const reviewRepo = manager.getRepository(Review);
      const reviewReactionRepo = manager.getRepository(ReviewReaction);
      const orderExecutorRepo = manager.getRepository(OrderExecutor);
      const orderContractRepo = manager.getRepository(OrderContact);
      const coinLogRepo = manager.getRepository(CoinLog);
      const podcastProgramProgressRepo = manager.getRepository(PodcastProgramProgress);
      const postRoleRepo = manager.getRepository(PostRole);
      const programTempoDeliveryRepo = manager.getRepository(ProgramTempoDelivery);
      const practiceRepo = manager.getRepository(Practice);
      const programTimeableRepo = manager.getRepository(ProgramTimetable);
      const attendRepo = manager.getRepository(Attend);
      const reviewReplyRepo = manager.getRepository(ReviewReply);

      const member = await memberRepo.findOneByOrFail([{ email: email, appId: appId }]);

      await notificationRepo.delete({ targetMember: { id: member.id } });
      await notificationRepo.delete({ sourceMember: { id: member.id } });

      await orderContractRepo.delete({ memberId: member.id });
      await orderExecutorRepo.delete({ memberId: member.id });

      const orderProducts = await orderProductRepo.find({
        where: { order: { memberId: member.id } },
      });
      await orderProductRepo.remove(orderProducts);

      const orderDiscounts = await orderDiscountRepo.find({
        where: { order: { memberId: member.id } },
      });
      await orderDiscountRepo.remove(orderDiscounts);

      const paymentLogs = await paymentLogRepo.find({
        where: { order: { memberId: member.id } },
      });
      await paymentLogRepo.remove(paymentLogs);

      const invoice = await invoiceRepo.find({
        where: { order: { memberId: member.id } },
      });
      await invoiceRepo.remove(invoice);

      const orderLogs = await orderLogRepo.findBy({ memberId: member.id });
      const orderIds = orderLogs.map(({ id }) => id);
      const orderChildLogs = await orderLogRepo.find({
        where: {
          parentOrder: {
            id: In(orderIds),
          },
        },
      });
      await orderLogRepo.update(
        {
          id: In(orderChildLogs.map(({ id }) => id)),
        },
        { parentOrder: null },
      );
      await orderLogRepo.remove(orderLogs);

      await attendRepo.delete({ memberId: member.id });
      await practiceRepo.delete({ memberId: member.id });
      await voucherRepo.delete({ memberId: member.id });
      await exerciseRepo.delete({ memberId: member.id });
      await issueReplyReactionRepo.delete({ memberId: member.id });
      await issueReactionRepo.delete({ memberId: member.id });
      await issueReplyRepo.delete({ memberId: member.id });
      await issueRepo.delete({ memberId: member.id });
      await commentReplyReactionRepo.delete({ memberId: member.id });
      await commentReplyRepo.delete({ memberId: member.id });
      await commentReactionRepo.delete({ memberId: member.id });
      await commentRepo.delete({ memberId: member.id });
      await coinLogRepo.delete({ memberId: member.id });
      await podcastProgramProgressRepo.delete({ memberId: member.id });
      await postRoleRepo.delete({ memberId: member.id });
      await programTimeableRepo.delete({ memberId: member.id });
      await programTempoDeliveryRepo.delete({ memberId: member.id });
      await programContentLogRepo.delete({ memberId: member.id });
      await programContentProgressRepo.delete({ memberId: member.id });
      await couponRepo.delete({ memberId: member.id });
      await reviewReactionRepo.delete({ memberId: member.id });
      await reviewReplyRepo.delete({ memberId: member.id });
      await reviewRepo.delete({ memberId: member.id });
      await memberContractRepo.delete({ memberId: member.id });
      await memberCardRepo.delete({ memberId: member.id });
      await memberTagRepo.delete({ memberId: member.id });
      await memberOauthRepo.delete({ memberId: member.id });
      await memberCategoryRepo.delete({ memberId: member.id });
      await memberDeviceRepo.delete({ memberId: member.id });
      await memberTrackingLogRepo.delete({ memberId: member.id });
      await memberNoteRepo.delete({ memberId: member.id });
      await memberTaskRepo.delete({ memberId: member.id });
      await memberPhoneRepo.delete({ memberId: member.id });
      await memberPropertyRepo.delete({ memberId: member.id });
      await memberPermissionExtraRepo.delete({ memberId: member.id });

      const deleteResult = await memberRepo.delete({ id: member.id });
      deleteResult.raw.push({ member });
      // deleteResult.raw.push({ notifications });
      deleteResult.raw.push({ orderDiscounts });
      deleteResult.raw.push({ orderProducts });
      deleteResult.raw.push({ paymentLogs });
      deleteResult.raw.push({ orderLogs });
      deleteResult.raw.push({ orderChildLogs });
      deleteResult.raw.push({ invoice });

      return deleteResult;
    });
  }
}
