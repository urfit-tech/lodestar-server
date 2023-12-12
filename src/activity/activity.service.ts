import { Injectable } from '@nestjs/common';
import { ActivityCollectionDTO, ActivityDto, FetchActivitiesResponseDto } from './activity.dto';
import { ActivityInfrastructure } from './activity.infra';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';

@Injectable()
export class ActivityService {
  constructor(
    @InjectEntityManager() private readonly entityManager: EntityManager,
    private readonly activityInfra: ActivityInfrastructure,
  ) {}

  async getActivityCollection(activityCollectionDto: ActivityCollectionDTO) {
    const response = new FetchActivitiesResponseDto();
    const activities = await this.activityInfra.getByApp(
      this.entityManager,
      activityCollectionDto.basicCondition.appId,
    );

    console.log('getActivityCollection getByApp', activities);

    const activityDtos = await Promise.all(
      activities.map(async (activity) => {
        const [activityDuration, sessionType, sessionTicketEnrollmentCount] = await Promise.all([
          this.activityInfra.getActivityDurationByActivityId(this.entityManager, activity.id),
          this.activityInfra.getActivitySessionTypeByActivityId(this.entityManager, activity.id),
          this.activityInfra.getActivityParticipantsByActivityId(this.entityManager, activity.id),
        ]);

        return new ActivityDto({
          id: activity.id,
          startedAt: activityDuration.startedAt,
          endedAt: activityDuration.endedAt,
          coverUrl: activity.coverUrl,
          isPrivate: activity.isPrivate,
          includeSessionTypes: sessionType,
          publishedAt: activity.publishedAt,
          title: activity.title,
          participantsCount: {
            online: sessionTicketEnrollmentCount.activityOnlineSessionTicketCount,
            offline: sessionTicketEnrollmentCount.activityOfflineSessionTicketCount,
          },
        });
      }),
    );

    response.activities = activityDtos;
    response.totalCount = activities.length;

    return response;
  }
}
