import { Module } from '@nestjs/common';
import { AppointmentPlanService } from './appointment-plan/appointment-plan.service';
import { AppointmentController } from './appointment.controller';
import { MemberService } from '~/member/member.service';
import { MemberModule } from '~/member/member.module';
import { DefinitionInfrastructure } from '~/definition/definition.infra';
import { AppointmentPlanInfraStructure } from './appointment-plan/appointment-plan.infra';

@Module({
  controllers: [AppointmentController],
  imports: [MemberModule],
  providers: [AppointmentPlanService, MemberService, DefinitionInfrastructure, AppointmentPlanInfraStructure],
})
export class AppointmentModule {}
