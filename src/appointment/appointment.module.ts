import { Module } from '@nestjs/common';
import { AppointmentPlanService } from './appointment-plan/appointment-plan.service';

@Module({
  providers: [AppointmentPlanService],
})
export class AppointmentModule {}
