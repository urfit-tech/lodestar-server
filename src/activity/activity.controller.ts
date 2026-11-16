import {
  Controller,
  Get,
  Headers,
  Logger,
  Param,
  ParseIntPipe,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
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
import { AuthService } from '~/auth/auth.service';
import { JwtMember } from '~/auth/auth.dto';
import { Local } from '~/decorator';
import { MEMBER_PAGE_ACTIVITY_STAFF_PERMISSIONS, resolveTargetMemberId } from '~/auth/authorization.helper';

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
    private readonly authService: AuthService,
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

  // Public activity page.
  // - With a Bearer token: the token's member (or, for staff / app owner, ?memberId) in the token's app.
  // - Without a token: legacy behavior kept for the deployed storefront (useEnrolledActivity sends ?memberId
  //   without a token): enrollment of ?memberId as given, activity scoped to the Host app.
  @Get(':activity_id')
  async getActivityByMemberId(
    @Req() request: Request,
    @Param('activity_id') activityId: string,
    @Headers('authorization') authorization?: string,
  ): Promise<any> {
    const { memberId, includeDeleted } = request.query;
    const host = request.headers.host;
    const caller = this.verifyOptionalToken(authorization);
    try {
      const appId = caller ? caller.appId : (await this.appService.getAppInfoByHost(host)).id;
      const targetMemberId = caller
        ? resolveTargetMemberId(caller, memberId, MEMBER_PAGE_ACTIVITY_STAFF_PERMISSIONS)
        : typeof memberId === 'string'
        ? memberId
        : undefined;
      const res = await this.activityService.getActivityByMemberId(
        activityId,
        targetMemberId,
        includeDeleted && String(includeDeleted) === 'true',
        appId,
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

  @UseGuards(AuthGuard)
  @Get()
  async getAllActivityByMemberId(@Local('member') member: JwtMember, @Req() request: Request): Promise<any> {
    const { memberId } = request.query;

    return this.activityService.getAllActivityTicketEnrollment(
      resolveTargetMemberId(member, memberId, MEMBER_PAGE_ACTIVITY_STAFF_PERMISSIONS),
      member.appId,
    );
  }

  // undefined without an Authorization header; 401 for a header that is not a valid Bearer token.
  private verifyOptionalToken(authorization?: string): JwtMember | undefined {
    if (!authorization) {
      return undefined;
    }
    const [type, token] = authorization.split(' ');
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException();
    }
    let member: JwtMember;
    try {
      member = this.authService.verify(token) as JwtMember;
    } catch {
      throw new UnauthorizedException();
    }
    if (!member?.appId || !member?.memberId) {
      throw new UnauthorizedException();
    }
    return member;
  }
}
