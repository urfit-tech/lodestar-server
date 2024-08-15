import { Module } from '@nestjs/common';
import { TemporallyExclusiveResourceService, } from './temporally-exclusive-resource.service';
import { TemporallyExclusiveResourceRruleService } from './temporally-exclusive-resource-rrule.service';
import { TemporallyExclusiveResourceController } from './temporally-exclusive-resource.controller';
import { TemporallyExclusiveResourceRruleController } from './temporally-exclusive-resource-rrule.controller';


@Module({
  controllers: [TemporallyExclusiveResourceController, TemporallyExclusiveResourceRruleController],
  providers: [TemporallyExclusiveResourceService, TemporallyExclusiveResourceRruleService]
})
export class TemporallyExclusiveResourceModule { }
