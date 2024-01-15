import { Controller, Get, Logger, Param, ParseIntPipe, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FetchActivitiesResponseDto, ActivityCollectionDTO } from './activity.dto';
import { ActivityService } from './activity.service';
import { JwtMember } from '~/auth/auth.dto';
import { Local } from '~/decorator';
import { Request } from 'express';

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

  @Get(':activity_id')
  async getActivityByMemberId(@Req() request: Request, @Param('activity_id') activityId: string): Promise<any> {
    const { memberId } = request.query;

    return this.activityService.getActivityByMemberId(activityId, String(memberId));
  }
}
