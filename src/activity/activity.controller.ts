import { Controller, Get, Logger, Param, ParseIntPipe, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ActivityService } from './activity.service';
import { ActivityCollectionDTO, ActivityParticipantResponse, FetchActivitiesResponseDto } from './dto/activity.dto';
import { Request } from 'express';
import { APIException } from '~/api.excetion';
import { AuthGuard } from '~/auth/auth.guard';
import { PermissionGuard } from '~/auth/permission.guard';
import { PermissionSet } from '~/enums/PermissionSet.enum';
import { Permissions } from '~/decorators/permissions.decorator';
import { AppService } from '~/app/app.service';
import { AppCache } from '~/app/app.type';

const ACTIVITY_ADMIN_PERMISSION_GROUP: PermissionSet[] = [
  PermissionSet.ACTIVITY_ADMIN,
  PermissionSet.ACTIVITY_ENROLLMENT_READ,
  PermissionSet.ACTIVITY_WRITE,
  PermissionSet.ACTIVITY_SESSION_WRITE,
  PermissionSet.ACTIVITY_TICKET_WRITE,
  PermissionSet.ACTIVITY_PUBLISHED,
  PermissionSet.ACTIVITY_CATEGORY_READ,
  PermissionSet.ACTIVITY_CATEGORY_WRITE,
  PermissionSet.ACTIVITY_CATEGORY_DELETE,
];

@ApiTags('Activity')
@Controller({
  path: 'activity',
  version: '2',
})
export class ActivityController {
  constructor(
    private readonly appService: AppService,
    private readonly activityService: ActivityService,
    private logger: Logger,
  ) {}

  @Get('activity_collection')
  public async activityCollection(
    @Query('basicCondition') basicConditionString: string,
    @Query('limit', ParseIntPipe) limit: number,
    @Query('offset', ParseIntPipe) offset: number,
    @Query('categoryId') categoryId?: string,
  ): Promise<FetchActivitiesResponseDto> {
    this.logger.log(`Fetching activity collection. Limit: ${limit}, Offset: ${offset}, CategoryId: ${categoryId}`);
    this.logger.log(`basicCondition: ${basicConditionString}`);

    const basicCondition = JSON.parse(basicConditionString);
    const activityCollectionDto: ActivityCollectionDTO = {
      basicCondition,
      limit,
      offset,
      categoryId,
    };

    try {
      const response = await this.activityService.getActivityCollection(activityCollectionDto);
      this.logger.log(`Successfully fetched activity collection.`);
      return response;
    } catch (error) {
      this.logger.error(`Error fetching activity collection: ${error.message}`);
      throw error;
    }
  }

  @Get(':activity_id')
  async getActivityByMemberId(@Req() request: Request, @Param('activity_id') activityId: string): Promise<any> {
    const { memberId, includeDeleted } = request.query;
    const host = request.headers.host;
    try {
      const appCache = await this.appService.getAppInfoByHost(host);
      const res = await this.activityService.getActivityByMemberId(
        activityId,
        String(memberId),
        includeDeleted && String(includeDeleted) === 'true',
        appCache.id,
      );
      if (!res.id) throw new Error();
      return res;
    } catch (error) {
      this.logger.error(`Error fetching activity: ${error}`);
      throw error;
    }
  }

  @Permissions(...ACTIVITY_ADMIN_PERMISSION_GROUP)
  @UseGuards(AuthGuard, PermissionGuard)
  @Get('/:activity_id/participants')
  async getActivityParticipants(@Param('activity_id') activityId: string): Promise<ActivityParticipantResponse> {
    try {
      return await this.activityService.getActivityParticipants(activityId);
    } catch (error) {
      throw new APIException({
        code: 'E_ACTIVITY_GET_PARTICIPANTS',
        message: `Failed to get activity participants: ${error.message}`,
        result: null,
      });
    }
  }

  @Get()
  async getAllActivityByMemberId(@Req() request: Request): Promise<any> {
    const { memberId } = request.query;

    return this.activityService.getAllActivityTicketEnrollment(String(memberId));
  }
}
