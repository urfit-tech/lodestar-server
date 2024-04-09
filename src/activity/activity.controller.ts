import { Body, Controller, Get, Logger, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FetchActivitiesResponseDto, ActivityCollectionDTO} from './dto/activity.dto';
import { ActivityService } from './activity.service';
import { AuthGuard } from '~/auth/auth.guard';
import { FetchMemberRightActivityTicketDTO } from './dto/member-right-activity-ticket.dto';
import { APIException } from '~/api.excetion';

@UseGuards(AuthGuard)
@ApiTags('Activity')
@Controller({
  path: 'activity',
  version: '2',
})
export class ActivityController {
  constructor(private logger: Logger, private readonly activityService: ActivityService) {}

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

  @Get('/member_right')
  public async memberRightActivityTicket(
    @Query() dto: FetchMemberRightActivityTicketDTO,
  ){
    try {
      return await this.activityService.memberRightActivityTicket(dto);
    } catch (error) {
      const errorMessage = `Error fetching activity collection: ${error.message}`;
      this.logger.error(errorMessage);

      throw new APIException({
        code: 'E_NOT_FOUND',
        message: `Activity ticket data not found, activity_ticket_id: ${dto.activityTicketId}, member_id: ${dto.memberId}, session_id ${dto.sessionId}`,
      });
    }
  }
}

