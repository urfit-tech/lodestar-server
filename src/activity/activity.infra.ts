import { EntityManager, SelectQueryBuilder } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Activity } from './entity/Activity';
import { ActivitySessionTicket } from './entity/ActivitySessionTicket';
import { ActivitySessionTicketEnrollmentCount } from './view_entity/ActivitySessionTicketEnrollmentCount';
import { ActivityTicket } from './entity/ActivityTicket';
import { ActivitySession } from './entity/ActivitySession';
import { Category } from '~/definition/entity/category.entity';
import { ActivityCategory } from './entity/ActivityCategory';
import { ActivityTicketEnrollment } from './view_entity/ActivityTicketEnrollment';
import { MemberRightActivityTicketDataDto } from './dto/member-right-activity-ticket.dto';
import { OrderProduct } from '~/order/entity/order_product.entity';
import { OrderLog } from '~/order/entity/order_log.entity';

interface ActivityDuration {
  startedAt: Date;
  endedAt: Date;
}

@Injectable()
export class ActivityInfrastructure {
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

  async getActivityTicketInfoByIdAndMemberId(manager: EntityManager, activityTicketId: string, memberId: string): Promise<MemberRightActivityTicketDataDto> {
    let activityTicket = await manager
      .createQueryBuilder(ActivityTicketEnrollment, "ate")
      .select("at2.id", "id")
      .addSelect("a.id", "activityId")
      .addSelect("a.title", "activityTitle")
      .addSelect("a.cover_url", "activityCoverUrl")
      .addSelect("m.name", "name")
      .addSelect("m.id", "memberId")
      .innerJoin("activity_ticket", "at2", "at2.id = ate.activity_ticket_id")
      .innerJoin("activity", "a", "a.id = at2.activity_id")
      .innerJoin("member", "m", "m.id = ate.member_id")
      .where("m.id = :memberId", { memberId })
      .andWhere("at2.id = :activityTicketId", { activityTicketId })
      .getRawOne();
  
    if (activityTicket == null) {
      throw new Error(`Activity ticket with ID '${activityTicketId}' for member '${memberId}' not found or access denied.`);
    }

    let invoice = await manager
    .createQueryBuilder(ActivityTicketEnrollment, "ate")
    .select("ol.invoice_options", 'invoiceOptions')
    .addSelect("ate.order_product_id", "orderProductId")
    .innerJoin(OrderProduct, 'op', 'op.id = ate.order_product_id')
    .innerJoin(OrderLog, 'ol', 'ol.id = op.order_id')
    .andWhere("ate.member_id = :memberId", {memberId})
    .andWhere("ate.activity_ticket_id = :activityTicketId", {activityTicketId})
    .getRawOne()

    console.log({invoice})
  
    let categories = await manager
      .createQueryBuilder(Category, "c")
      .select("c.id", "id")
      .addSelect("c.name", "name")
      .innerJoin(ActivityCategory, "ac", "ac.category_id = c.id")
      .andWhere("ac.activity_id = :activityId", {
        activityId: activityTicket.activityId,
      })
      .getRawMany();
  
      const sessions = await manager
      .createQueryBuilder(ActivitySession, "asession")
      .select(
        `DISTINCT ON (asession.id) asession.id as id,
        asession.started_at as "startedAt",
        asession.ended_at as "endedAt",
        asession.location as "location",
        asession.description as "description",
        asession.threshold as "threshold",
        asession.online_link as "onlineLink",
        asession.title as "title",
        astec.activity_offline_session_ticket_count as "offlineParticipants",
        astec.activity_online_session_ticket_count as "onlineParticipants",
        ast.activity_session_type as "type",
        (SELECT SUM(CASE WHEN ast.activity_session_type = 'offline' THEN 1 ELSE 0 END) FROM activity_session_ticket ast WHERE ast.activity_session_id = asession.id) as "maxAmountOffline",
        (SELECT SUM(CASE WHEN ast.activity_session_type = 'online' THEN 1 ELSE 0 END) FROM activity_session_ticket ast WHERE ast.activity_session_id = asession.id) as "maxAmountOnline",
        ae.attended as "attended"`
      )
      .leftJoin(
        "activity_session_ticket",
        "ast",
        "ast.activity_session_id = asession.id"
      )
      .leftJoin("activity_ticket", "at", "at.id = ast.activity_ticket_id")
      .leftJoin(
        "activity_session_ticket_enrollment_count",
        "astec",
        "astec.activity_session_id = asession.id"
      )
      .leftJoin(
        "activity_enrollment",
        "ae",
        "ae.activity_session_id = asession.id AND ae.activity_ticket_id = at.id"
      )
      .where("at.id = :activityTicketId", { activityTicketId })
      .orderBy("asession.id", "DESC")
      .getRawMany();
  
    let activitySessions = sessions.map((session) => ({
      id: session.id,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      location: session.location,
      description: session.description,
      threshold: session.threshold,
      onlineLink: session.onlineLink,
      title: session.title,
      maxAmount: {
        offline: parseInt(session.maxAmountOffline, 10) || 0,
        online: parseInt(session.maxAmountOnline, 10) || 0,
      },
      participants: {
        online: session.onlineParticipants,
        offline: session.offlineParticipants,
      },
      isEnrolled: true,
      type: session.type,
      attended: session.attended
    }));
  
    return {
      id: activityTicket.id,
      activity: {
        id: activityTicket.activityId,
        title: activityTicket.activityTitle,
        coverUrl: activityTicket.activityCoverUrl,
        categories,
      },
      sessions: activitySessions,
      invoice: {
        name: invoice.invoiceOptions.name,
        email: invoice.invoiceOptions.email,
        phone: invoice.invoiceOptions.phone,
        orderProductId: invoice.orderProductId
      }
    };
  }
  

}
