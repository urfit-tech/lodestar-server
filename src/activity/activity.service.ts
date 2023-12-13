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
    console.log('activityCollectionDto', activityCollectionDto.basicCondition);
    const response = new FetchActivitiesResponseDto();

    console.time('Get Activities By App');
    const [activities, totalCount] = await this.activityInfra.getByApp(
      this.entityManager,
      activityCollectionDto.basicCondition.appId,
      activityCollectionDto.limit,
      activityCollectionDto.offset,
      activityCollectionDto.categoryId,
      activityCollectionDto.basicCondition.scenario,
    );
    console.timeEnd('Get Activities By App');

    const activityIds = activities.map((activity) => activity.id);

    console.time('Get Activity Durations');
    const activityDurations = await this.activityInfra.getActivityDurationsByActivityIds(
      this.entityManager,
      activityCollectionDto.basicCondition.appId,
      activityIds,
    );
    console.timeEnd('Get Activity Durations');

    console.time('Get Session Types');
    const sessionTypes = await this.activityInfra.getActivitySessionTypesByActivityIds(this.entityManager, activityIds);
    console.timeEnd('Get Session Types');

    console.time('Get Participants Counts');
    const participantsCounts = await this.activityInfra.getActivityParticipantsByActivityIds(
      this.entityManager,
      activityIds,
    );
    console.timeEnd('Get Participants Counts');

    // 创建活动 DTOs
    const activityDtos = activities.map((activity) => {
      const activityDuration = activityDurations.get(activity.id);
      const sessionType = sessionTypes.get(activity.id);
      const sessionTicketEnrollmentCount = participantsCounts.get(activity.id);

      return new ActivityDto({
        id: activity.id,
        startedAt: activityDuration?.startedAt,
        endedAt: activityDuration?.endedAt,
        coverUrl: activity.coverUrl,
        isPrivate: activity.isPrivate,
        includeSessionTypes: sessionType || [],
        publishedAt: activity.publishedAt,
        title: activity.title,
        createdAt: activity.createdAt,
        participantsCount: {
          online: sessionTicketEnrollmentCount ? sessionTicketEnrollmentCount.activityOnlineSessionTicketCount : 0,
          offline: sessionTicketEnrollmentCount ? sessionTicketEnrollmentCount.activityOfflineSessionTicketCount : 0,
        },
      });
    });

    response.activities = activityDtos;
    response.totalCount = totalCount;

    console.log('totalCount', totalCount);

    return response;
  }
}
