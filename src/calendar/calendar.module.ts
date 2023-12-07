import { Module } from '@nestjs/common';

import { CalendarController } from './calendar.controller';

@Module({
  controllers: [CalendarController],
  imports: [],
  providers: [],
  exports: [],
})
export class CalendarModule {}
