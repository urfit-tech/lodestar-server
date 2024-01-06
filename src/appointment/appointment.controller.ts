import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtMember } from '~/auth/auth.dto';
import { Local } from '~/decorator';
import { AppointmentPlanService } from './appointment-plan/appointment-plan.service';
import { AppCache } from '~/app/app.type';

@Controller({
  path: 'appointment',
  version: '2',
})
export class AppointmentController {
  constructor(private appointmentPlanService: AppointmentPlanService) {}

  @Get()
  async getAppointmentPlanEnrollmentById(
    @Local('appCache') appCache: AppCache,
    @Local('member') member: JwtMember,
    @Req() request: Request,
  ) {
    const { id: appId } = appCache;
    const { memberId } = request.query;

    return this.appointmentPlanService.getAppointmentPlanEnrollmentById(
      appId || member.appId,
      String(memberId || member.memberId),
    );
  }
}
