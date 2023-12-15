import { Body, Controller, Get, Logger, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FetchActivitiesResponseDto, ActivityCollectionDTO } from './activity.dto';
import { ActivityService } from './activity.service';
import { AuthGuard } from '~/auth/auth.guard';

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
}
