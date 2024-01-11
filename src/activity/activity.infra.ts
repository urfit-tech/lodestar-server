import { EntityManager, SelectQueryBuilder } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Activity } from './entity/Activity';
import { ActivitySessionTicket } from './entity/ActivitySessionTicket';
import { ActivitySessionTicketEnrollmentCount } from './view_entity/ActivitySessionTicketEnrollmentCount';

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
}
