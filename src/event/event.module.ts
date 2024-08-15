import { Module } from '@nestjs/common';
import { MemberModule } from '~/member/member.module';
import { AuthModule } from '~/auth/auth.module';
import { EventController } from './event.controller'
import { EventService } from './event.service'
import { TemporallyExclusiveResourceController } from './temporally-exclusive-resource.controller'
import { TemporallyExclusiveResourceService } from './temporally-exclusive-resource.service'

@Module({
  controllers: [EventController, TemporallyExclusiveResourceController],
  imports: [AuthModule, MemberModule],
  providers: [EventService, TemporallyExclusiveResourceService],
})
export class EventModule { }
