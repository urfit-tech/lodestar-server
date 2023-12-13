import { EntityManager } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Activity } from './entity/Activity';
import { ActivityDuringPeriod } from './view_entity/ActivityDuringPeriod';
import { ActivitySessionTicket } from './entity/ActivitySessionTicket';
import { ActivitySessionTicketEnrollmentCount } from './view_entity/ActivitySessionTicketEnrollmentCount';

@Injectable()
export class ActivityInfrastructure {
  async getByApp(
    manager: EntityManager,
    appId: string,
    limit = 10,
    offset = 0,
    categoryId?: string,
    activityEndedAfterNow?: boolean,
    publishedAtNotNull = true,
    isPrivate = false,
  ): Promise<[Activity[], number]> {
    const activityRepo = manager.getRepository(Activity);

    const queryBuilder = activityRepo
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity_during_period', 'adp', 'adp.activity_id = activity.id')
      .leftJoinAndSelect('activity_session_ticket_enrollment_count', 'astec', 'astec.activity_id = activity.id')
      .leftJoinAndSelect('activity.activityCategories', 'ac', 'ac.activity_id = activity.id')
      .where('activity.appId = :appId', { appId });

    if (categoryId) {
      console.log('categoryId', categoryId);
      queryBuilder
        .innerJoin('activity.activityCategories', 'activityCategory')
        .andWhere('activityCategory.categoryId = :categoryId', { categoryId });
    }

    if (typeof activityEndedAfterNow !== 'undefined') {
      if (activityEndedAfterNow) {
        queryBuilder.andWhere('adp.ended_at is not null').andWhere('adp.ended_at > now()');
      } else {
        queryBuilder.andWhere('adp.ended_at < now()').orWhere('adp.ended_at is null');
      }
    }

    if (!publishedAtNotNull) {
      queryBuilder.andWhere('activity.published_at is null');
    } else {
      queryBuilder.andWhere('activity.published_at is not null');
    }

    if (isPrivate) {
      queryBuilder.andWhere('activity.is_private = true');
    }

    queryBuilder.orderBy('activity.createdAt', 'DESC', 'NULLS LAST');

    return queryBuilder.take(limit).skip(offset).getManyAndCount();
  }

  async getActivityDurationByActivityId(manager: EntityManager, activityId: string): Promise<ActivityDuringPeriod> {
    const activityDuringPeriodRepo = manager.getRepository(ActivityDuringPeriod);

    return activityDuringPeriodRepo.findOne({
      where: { activityId: activityId },
    });
  }

  async getActivitySessionTypeByActivityId(
    manager: EntityManager,
    activityId: string,
  ): Promise<('offline' | 'online')[]> {
    const activitySessionTickets = await manager
      .getRepository(ActivitySessionTicket)
      .createQueryBuilder('activitySessionTicket')
      .leftJoinAndSelect('activitySessionTicket.activityTicket', 'activityTicket')
      .leftJoinAndSelect('activityTicket.activity', 'activity')
      .where('activity.id = :activityId', { activityId })
      .getMany();

    const sessionTypes = new Set(activitySessionTickets.map((v) => v.activitySessionType as 'offline' | 'online'));

    return Array.from(sessionTypes);
  }

  async getActivityParticipantsByActivityId(
    manager: EntityManager,
    activityId: string,
  ): Promise<ActivitySessionTicketEnrollmentCount> {
    const sessionTicketEnrollmentCount = await manager.getRepository(ActivitySessionTicketEnrollmentCount).findOne({
      where: { activityId: activityId },
    });
    return sessionTicketEnrollmentCount;
  }
}
