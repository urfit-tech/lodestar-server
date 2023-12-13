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
    const [activities, totalCount] = await this.activityInfra.getByApp(
      this.entityManager,
      activityCollectionDto.basicCondition.appId,
      activityCollectionDto.limit,
      activityCollectionDto.offset,
      activityCollectionDto.categoryId,
      activityCollectionDto.basicCondition.activityEndedAfterNow,
      activityCollectionDto.basicCondition.publishedAtNotNull,
      activityCollectionDto.basicCondition.isPrivate,
    );

    const activityDtos = await Promise.all(
      activities.map(async (activity) => {
        console.time(`Activity Duration - ${activity.id}`);
        const activityDuration = await this.activityInfra.getActivityDurationByActivityId(
          this.entityManager,
          activity.id,
        );
        console.timeEnd(`Activity Duration - ${activity.id}`);

        console.time(`Session Type - ${activity.id}`);
        const sessionType = await this.activityInfra.getActivitySessionTypeByActivityId(
          this.entityManager,
          activity.id,
        );
        console.timeEnd(`Session Type - ${activity.id}`);

        console.time(`Participants Count - ${activity.id}`);
        const sessionTicketEnrollmentCount = await this.activityInfra.getActivityParticipantsByActivityId(
          this.entityManager,
          activity.id,
        );
        console.timeEnd(`Participants Count - ${activity.id}`);

        return new ActivityDto({
          id: activity.id,
          startedAt: activityDuration?.startedAt,
          endedAt: activityDuration?.endedAt,
          coverUrl: activity.coverUrl,
          isPrivate: activity.isPrivate,
          includeSessionTypes: sessionType,
          publishedAt: activity.publishedAt,
          title: activity.title,
          createdAt: activity.createdAt,
          participantsCount: {
            online: sessionTicketEnrollmentCount ? sessionTicketEnrollmentCount.activityOnlineSessionTicketCount : 0,
            offline: sessionTicketEnrollmentCount ? sessionTicketEnrollmentCount.activityOfflineSessionTicketCount : 0,
          },
        });
      }),
    );

    response.activities = activityDtos;
    response.totalCount = totalCount;

    console.log('totalCount', totalCount);

    return response;
  }
}
