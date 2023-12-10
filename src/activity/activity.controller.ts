import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Activity')
@Controller({
  path: 'activity',
  version: '2',
})
export class ActivityController {
  @Get('activity_collection')
  public async activityCollection() {
    return {
      status: 200,
    };
  }
}
