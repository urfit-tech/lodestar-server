import { forwardRef, Logger, Module } from '@nestjs/common';
import { EquityController } from './equity.controller';
import { AuthModule } from '~/auth/auth.module';
import { DefinitionModule } from '~/definition/definition.module';
import { ActivityTicketInfrastructure } from '~/activity/activity-ticket/activity-ticket.infra';
import { ActivityTicketService } from '~/activity/activity-ticket/activity-ticket.service';
import { ActivityModule } from '~/activity/activity.module';
import { ProgramService } from '~/program/program.service';
import { MemberService } from '~/member/member.service';
import { ProgramInfrastructure } from '~/program/program.infra';
import { UtilityService } from '~/utility/utility.service';
import { MemberInfrastructure } from '~/member/member.infra';

@Module({
  controllers: [EquityController],
  imports: [DefinitionModule, forwardRef(() => AuthModule), ActivityModule],
  providers: [
    Logger,
    ActivityTicketInfrastructure,
    ProgramInfrastructure,
    MemberInfrastructure,
    ActivityTicketService,
    ProgramService,
    MemberService,
    UtilityService,
  ],
})
export class EquityModule {}
