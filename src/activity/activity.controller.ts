import { Body, Controller, Get, Logger, Post, Query } from '@nestjs/common';
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
    @Body() activityCollectionDto: ActivityCollectionDTO,
  ): Promise<FetchActivitiesResponseDto> {
    const response = this.activityService.getActivityCollection(activityCollectionDto);

    return response;
  }
}
