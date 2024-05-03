import { EntityManager, IsNull, SelectQueryBuilder } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Activity } from './entity/Activity';
import { ActivitySessionTicket } from './entity/ActivitySessionTicket';
import { ActivitySessionTicketEnrollmentCount } from './view_entity/ActivitySessionTicketEnrollmentCount';
import { UtilityService } from '~/utility/utility.service';
import { OrderLog } from '~/order/entity/order_log.entity';

interface ActivityDuration {
  startedAt: Date;
  endedAt: Date;
}

@Injectable()
export class ActivityInfrastructure {
  constructor(private readonly utilityService: UtilityService) {}

  createActivityPeriodSubQuery(manager: EntityManager, appId: string): SelectQueryBuilder<Activity> {
    return manager
      .getRepository(Activity)
      .createQueryBuilder('activity')
      .select('activity.id', 'unique_activity_id')
      .leftJoin('activity.activitySessions', 'as')
      .addSelect('MIN(as.started_at)', 'started_at')
      .addSelect('MAX(as.ended_at)', 'ended_at')
      .where('activity.deleted_at IS NULL')
      .andWhere('activity.app_id = :appId', { appId })
      .groupBy('activity.id');
  }

  async getByApp(
    manager: EntityManager,
    appId: string,
    limit = 10,
    offset = 0,
    categoryId?: string,
    scenario?: 'holding' | 'finished' | 'draft' | 'privateHolding',
  ): Promise<[Activity[], number]> {
    const activityRepo = manager.getRepository(Activity);

    const activityPeriodSubQuery = this.createActivityPeriodSubQuery(manager, appId);

    const queryBuilder = activityRepo
      .createQueryBuilder('activity')
      .leftJoin(`(${activityPeriodSubQuery.getQuery()})`, 'adp', 'adp.unique_activity_id = activity.id')
      .leftJoin('activity.activityCategories', 'ac', 'ac.activity_id = activity.id')
      .where('activity.appId = :appId', { appId })
      .setParameters({
        ...activityPeriodSubQuery.getParameters(),
      });

    if (categoryId) {
      queryBuilder
        .innerJoin('activity.activityCategories', 'activityCategory')
        .andWhere('activityCategory.categoryId = :categoryId', { categoryId });
    }

    switch (scenario) {
      case 'holding':
        queryBuilder
          .andWhere('activity.is_private = false')
          .andWhere('activity.published_at IS NOT NULL')
          .andWhere('adp.ended_at > CURRENT_TIMESTAMP');
        break;
      case 'finished':
        queryBuilder.andWhere('activity.published_at IS NOT NULL').andWhere('adp.ended_at < CURRENT_TIMESTAMP');
        break;
      case 'draft':
        queryBuilder.andWhere('activity.published_at IS NULL');
        break;
      case 'privateHolding':
        queryBuilder.andWhere('activity.is_private = true').andWhere('adp.ended_at > CURRENT_TIMESTAMP');
        break;
    }
    queryBuilder.orderBy('activity.createdAt', 'DESC', 'NULLS LAST');

    return queryBuilder.take(limit).skip(offset).getManyAndCount();
  }

  async getActivityDurationsByActivityIds(
    manager: EntityManager,
    appId: string,
    activityIds: string[],
  ): Promise<Map<string, ActivityDuration>> {
    if (activityIds.length === 0) {
      return new Map();
    }

    const query = manager
      .getRepository(Activity)
      .createQueryBuilder('activity')
      .select('activity.id', 'activity_id')
      .leftJoin('activity.activitySessions', 'as')
      .addSelect('MIN(as.started_at)', 'started_at')
      .addSelect('MAX(as.ended_at)', 'ended_at')
      .where('activity.deleted_at IS NULL')
      .andWhere('activity.app_id = :appId', { appId })
      .andWhere('activity.id IN (:...activityIds)', { activityIds })
      .groupBy('activity.id');

    const results = await query.getRawMany();

    const durations = new Map<string, ActivityDuration>();
    results.forEach((result) => {
      durations.set(result.activity_id, {
        startedAt: new Date(result.started_at),
        endedAt: new Date(result.ended_at),
      });
    });

    return durations;
  }

  async getActivitySessionTypesByActivityIds(
    manager: EntityManager,
    activityIds: string[],
  ): Promise<Map<string, ('offline' | 'online')[]>> {
    if (activityIds.length === 0) {
      return new Map();
    }

    const activitySessionTickets = await manager
      .getRepository(ActivitySessionTicket)
      .createQueryBuilder('activitySessionTicket')
      .addSelect('activity.id', 'activity_id')
      .leftJoin('activitySessionTicket.activityTicket', 'activityTicket')
      .leftJoin('activityTicket.activity', 'activity')
      .where('activity.id IN (:...activityIds)', { activityIds })
      .getRawMany();
    const sessionTypesMap = new Map<string, Set<'offline' | 'online'>>();

    for (const ticket of activitySessionTickets) {
      const activityId = ticket.activity_id;
      if (activityId) {
        let typesSet = sessionTypesMap.get(activityId);
        if (!typesSet) {
          typesSet = new Set<'offline' | 'online'>();
          sessionTypesMap.set(activityId, typesSet);
        }
        typesSet.add(ticket.activitySessionTicket_activity_session_type as 'offline' | 'online');
      }
    }

    const sessionTypesMapAsArray = new Map<string, ('offline' | 'online')[]>();
    sessionTypesMap.forEach((typesSet, activityId) => {
      sessionTypesMapAsArray.set(activityId, Array.from(typesSet));
    });
    return sessionTypesMapAsArray;
  }

  async getActivityParticipantsByActivityIds(
    manager: EntityManager,
    activityIds: string[],
  ): Promise<Map<string, ActivitySessionTicketEnrollmentCount[]>> {
    if (activityIds.length === 0) {
      return new Map();
    }

    const sessionTicketEnrollmentCounts = await manager
      .getRepository(ActivitySessionTicketEnrollmentCount)
      .createQueryBuilder('enrollmentCount')
      .where('enrollmentCount.activityId IN (:...activityIds)', { activityIds })
      .getMany();

    const enrollmentCountMap = new Map<string, ActivitySessionTicketEnrollmentCount[]>();

    sessionTicketEnrollmentCounts.forEach((count) => {
      const activityId = count.activityId;
      if (!enrollmentCountMap.has(activityId)) {
        enrollmentCountMap.set(activityId, []);
      }
      enrollmentCountMap.get(activityId)?.push(count);
    });

    return enrollmentCountMap;
  }

  async getPublishedActivity(manager: EntityManager, activityId: string) {
    const activity = await manager.getRepository(Activity).findOne({
      where: {
        id: activityId,
      },
      select: {
        id: true,
        organizerId: true,
        coverUrl: true,
        title: true,
        description: true,
        publishedAt: true,
        isParticipantsVisible: true,
        supportLocales: true,
        activityTags: {
          id: true,
          activityTagName: true,
        },
        activityCategories: {
          id: true,
          category: {
            id: true,
            name: true,
          },
        },
        activityTickets: {
          id: true,
          title: true,
          count: true,
          description: true,
          startedAt: true,
          isPublished: true,
          endedAt: true,
          price: true,
          currencyId: true,
          deletedAt: true,
          activitySessionTickets: {
            id: true,
            activitySessionType: true,
            activitySession: {
              id: true,
              onlineLink: true,
              location: true,
              startedAt: true,
              endedAt: true,
              description: true,
              threshold: true,
              title: true,
            },
          },
        },
      },
      relations: {
        activityTags: true,
        activityCategories: { category: true },
        activityTickets: { activitySessionTickets: { activitySession: true } },
      },
    });
    return this.utilityService.convertObjectKeysToCamelCase(activity);
  }

  async getAllActivityTicketEnrollment(memberId: string, manager: EntityManager) {
    const activityTickets = await manager
      .getRepository(OrderLog)
      .createQueryBuilder('order_log')
      .select([
        'activity_ticket.id AS activity_ticket_id',
        'order_log.id AS order_id',
        'order_product.id AS order_product_id',
        `JSONB_AGG(DISTINCT JSONB_BUILD_OBJECT('id', activity_session.id, 'started_at', activity_session.started_at, 'ended_at', activity_session.ended_at, 'location', activity_session.location, 'online_link', activity_session.online_link, 'activity_title', activity.title, 'title', activity_session.title, 'activity_cover_url', activity.cover_url )) AS activity_session`,
      ])
      .where(`order_log.member_id = :memberId`, { memberId })
      .innerJoin(
        `order_product`,
        'order_product',
        'order_product.order_id = order_log.id' +
          ' AND order_product.delivered_at < NOW()' +
          ` AND order_product.product_id ~~ 'ActivityTicket_%'`,
      )
      .leftJoin(
        'activity_ticket',
        'activity_ticket',
        `activity_ticket.id::text = split_part(order_product.product_id,'_',2)`,
      )
      .leftJoin('activity', 'activity', 'activity.id = activity_ticket.activity_id')
      .leftJoin(
        'activity_session_ticket',
        'activity_session_ticket',
        'activity_session_ticket.activity_ticket_id = activity_ticket.id',
      )
      .leftJoin(
        'activity_session',
        'activity_session',
        'activity_session.id = activity_session_ticket.activity_session_id',
      )
      .groupBy('activity_ticket.id')
      .addGroupBy('order_log.id')
      .addGroupBy('order_product.id')
      .getRawMany();

    return this.utilityService.convertObjectKeysToCamelCase(activityTickets);
  }

  async getActivityTicketEnrollment(activityId: string, memberId: string, manager: EntityManager) {
    const activityTickets = await manager
      .getRepository(OrderLog)
      .createQueryBuilder('order_log')
      .select([
        'activity_ticket.id AS activity_ticket_id',
        'order_log.id AS order_id',
        'order_product.id AS order_product_id',
        `JSONB_AGG(DISTINCT JSONB_BUILD_OBJECT('id', activity_session_ticket.activity_session_id, 'attended', activity_attendance.id is not null)) AS activity_session`,
      ])
      .where(`order_log.member_id = :memberId`, { memberId })
      .innerJoin(
        `order_product`,
        'order_product',
        'order_product.order_id = order_log.id' +
          ' AND order_product.delivered_at < NOW()' +
          ` AND order_product.product_id ~~ 'ActivityTicket_%'`,
      )
      .leftJoin(
        'activity_ticket',
        'activity_ticket',
        `activity_ticket.id::text = split_part(order_product.product_id,'_',2)` +
          ' AND activity_ticket.activity_id = :activityId',
        { activityId },
      )
      .leftJoin(
        'activity_session_ticket',
        'activity_session_ticket',
        'activity_session_ticket.activity_ticket_id = activity_ticket.id',
      )
      .leftJoin('activity_attendance', 'activity_attendance', 'activity_attendance.order_product_id = order_product.id')
      .groupBy('activity_ticket.id')
      .addGroupBy('order_log.id')
      .addGroupBy('order_product.id')
      .getRawMany();

    return this.utilityService.convertObjectKeysToCamelCase(activityTickets);
  }

  async getActivityTicketEnrollmentCount(activityId: string, manager: EntityManager) {
    const activityTicketCount = await manager
      .getRepository(OrderLog)
      .createQueryBuilder('order_log')
      .select(['activity_ticket.id AS activity_ticket_id', 'COUNT(activity_ticket.id) AS participants'])
      .innerJoin(
        `order_product`,
        'order_product',
        'order_product.order_id = order_log.id' + ' AND order_product.delivered_at < NOW()',
      )
      .innerJoin('product', 'product', 'product.id = order_product.product_id' + ` AND product.type = :productType`, {
        productType: 'ActivityTicket',
      })
      .innerJoin(
        'activity_ticket',
        'activity_ticket',
        'activity_ticket.id::text = product.target' + ' AND activity_ticket.activity_id = :activityId',
        { activityId },
      )
      .groupBy('activity_ticket.id')
      .getRawMany();

    return this.utilityService.convertObjectKeysToCamelCase(activityTicketCount);
  }
}
