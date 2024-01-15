import { Injectable } from '@nestjs/common';
import { ActivityCollectionDTO, ActivityDto, FetchActivitiesResponseDto } from './activity.dto';
import { ActivityInfrastructure } from './activity.infra';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { Activity } from './entity/Activity';
import { ActivitySessionTicketEnrollmentCount } from './view_entity/ActivitySessionTicketEnrollmentCount';

@Injectable()
export class ActivityService {
  constructor(
    @InjectEntityManager() private readonly entityManager: EntityManager,
    private readonly activityInfra: ActivityInfrastructure,
  ) {}

  async getActivityCollection(activityCollectionDto: ActivityCollectionDTO): Promise<FetchActivitiesResponseDto> {
    const appId = activityCollectionDto.basicCondition.appId;
    const logPrefix = `Get Activities By App host ${appId}`;

    console.log('activityCollectionDto', activityCollectionDto.basicCondition);
    console.time(logPrefix);

    const [activities, totalCount] = await this.getActivities(activityCollectionDto);
    const activityIds = activities.map((activity) => activity.id);

    const [activityDurations, sessionTypes, participantsCounts] = await Promise.all([
      this.getActivityDurations(activityCollectionDto, activityIds),
      this.getSessionTypes(activityIds),
      this.getParticipantsCounts(activityIds),
    ]);

    const activityDtos = this.mapActivitiesToDtos(activities, activityDurations, sessionTypes, participantsCounts);

    console.timeEnd(logPrefix);

    const res = new FetchActivitiesResponseDto();
    res.activities = activityDtos;
    res.totalCount = totalCount;

    return res;
  }

  public async getActivityByMemberId(activityId: string, memberId?: string) {
    // Todo: check permission
    // ...

    const activity = await this.activityInfra.getPublishedActivity(activityId, this.entityManager);
    const activityTickets = await this.activityInfra.getActivityTicketEnrollment(
      activityId,
      memberId,
      this.entityManager,
    );

    const participants = await this.activityInfra.getActivityTicketEnrollmentCount(activityId, this.entityManager);

    return {
      ...activity,
      activityTickets: activity.activityTickets
        .sort((a, b) => a.endedAt - b.endedAt)
        .map((ticket) => {
          const enrolledTicket = activityTickets.find((t) => t.activityTicketId === ticket.id);
          const enrolledParticipants = participants.find((t) => t.activityTicketId === ticket.id);
          return {
            ...ticket,
            participants: enrolledParticipants?.participants || 0,
            orderId: enrolledTicket?.orderId || null,
            orderProductId: enrolledTicket?.orderProductId || null,
            activitySessionTickets: ticket.activitySessionTickets
              .sort((a, b) => a.activitySession.startedAt - b.activitySession.startedAt)
              .map((st) => {
                const attended = !!enrolledTicket?.activitySession?.find((s) => s.id === st.activitySession.id)
                  ?.attended;
                return { ...st, activitySession: { ...st.activitySession, attended } };
              }),
          };
        }),
    };
  }

  public async getAllActivityTicketEnrollment(memberId: string) {
    // Todo: check permission
    // ...

    return await this.activityInfra.getAllActivityTicketEnrollment(memberId, this.entityManager);
  }

  private async getActivities(dto: ActivityCollectionDTO): Promise<[Activity[], number]> {
    return this.activityInfra.getByApp(
      this.entityManager,
      dto.basicCondition.appId,
      dto.limit,
      dto.offset,
      dto.categoryId,
      dto.basicCondition.scenario,
    );
  }

  private async getActivityDurations(dto: ActivityCollectionDTO, activityIds: string[]) {
    return this.activityInfra.getActivityDurationsByActivityIds(
      this.entityManager,
      dto.basicCondition.appId,
      activityIds,
    );
  }

  private async getSessionTypes(activityIds: string[]) {
    return this.activityInfra.getActivitySessionTypesByActivityIds(this.entityManager, activityIds);
  }

  private async getParticipantsCounts(activityIds: string[]) {
    return this.activityInfra.getActivityParticipantsByActivityIds(this.entityManager, activityIds);
  }

  private mapActivitiesToDtos(
    activities: Activity[],
    activityDurations: Map<string, any>,
    sessionTypes: Map<string, any>,
    participantsCounts: Map<string, ActivitySessionTicketEnrollmentCount[]>,
  ): ActivityDto[] {
    return activities.map((activity) => {
      const activityDuration = activityDurations.get(activity.id);
      const sessionType = sessionTypes.get(activity.id);
      const sessionTicketEnrollmentCounts = participantsCounts.get(activity.id) || [];

      const { totalOnlineCount, totalOfflineCount } = sessionTicketEnrollmentCounts.reduce(
        (acc, count) => {
          acc.totalOnlineCount += Number(count.activityOnlineSessionTicketCount);
          acc.totalOfflineCount += Number(count.activityOfflineSessionTicketCount);
          return acc;
        },
        { totalOnlineCount: 0, totalOfflineCount: 0 },
      );

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
          online: totalOnlineCount,
          offline: totalOfflineCount,
        },
      });
    });
  }
}
