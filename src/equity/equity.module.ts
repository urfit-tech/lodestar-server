import { forwardRef, Logger, Module } from '@nestjs/common';
import { EquityController } from './equity.controller';
import { AuthModule } from '~/auth/auth.module';
import { DefinitionModule } from '~/definition/definition.module';
import { ActivityTicketInfrastructure } from '~/activity/activity-ticket/activity-ticket.infra';
import { ActivityTicketService } from '~/activity/activity-ticket/activity-ticket.service';
import { ActivityModule } from '~/activity/activity.module';
import { ProgramModule } from '~/program/program.module';
import { ProgramService } from '~/program/program.service';
import { MemberService } from '~/member/member.service';
import { MemberModule } from '~/member/member.module';

@Module({
  controllers: [EquityController],
  imports: [DefinitionModule, forwardRef(() => AuthModule), ActivityModule, ProgramModule, MemberModule],
  providers: [Logger, ActivityTicketInfrastructure, ActivityTicketService, ProgramService, MemberService],
})
export class EquityModule {}
