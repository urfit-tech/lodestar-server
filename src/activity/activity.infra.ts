import { EntityManager } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Activity } from './entity/Activity';
import { ActivityDuringPeriod } from './view_entity/ActivityDuringPeriod';
import { ActivitySessionTicket } from './entity/ActivitySessionTicket';
import { ActivitySessionTicketEnrollmentCount } from './view_entity/ActivitySessionTicketEnrollmentCount';

@Injectable()
export class ActivityInfrastructure {
  async getByApp(manager: EntityManager, appId: string): Promise<Activity[]> {
    const activityRepo = manager.getRepository(Activity);
    return activityRepo.find({
      where: { appId: appId },
    });
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

    return activitySessionTickets.map((v) => v.activitySessionType as 'offline' | 'online').filter(Boolean);
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
