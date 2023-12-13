import { Body, Controller, Get, Logger, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FetchActivitiesResponseDto, ActivityDto, ParticipantsCountDto, ActivityCollectionDTO } from './activity.dto';
import { Activity } from './entity/Activity';
import { ActivityService } from './activity.service';

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
    const basicCondition = JSON.parse(basicConditionString);
    console.log(limit, offset, categoryId);
    const activityCollectionDto: ActivityCollectionDTO = {
      basicCondition,
      limit,
      offset,
      categoryId,
    };

    const response = await this.activityService.getActivityCollection(activityCollectionDto);

    return response;
  }
}
