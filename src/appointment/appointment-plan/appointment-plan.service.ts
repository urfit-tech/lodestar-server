import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { APIException } from '~/api.excetion';
import { MemberService } from '~/member/member.service';
import { AppointmentPlanInfraStructure } from './appointment-plan.infra';

@Injectable()
export class AppointmentPlanService {
  constructor(
    private readonly memberService: MemberService,
    private readonly appointmentPlanInfra: AppointmentPlanInfraStructure,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}

  public async getAppointmentPlanEnrollmentById(appId: string, memberId: string) {
    // Todo: check permission
    // ...
    const { data: memberData } = await this.memberService.getMembersByCondition(appId, { limit: 1 }, { id: memberId });
    if (memberData.length === 0) {
      throw new APIException({
        code: 'E_NO_MEMBER',
        message: 'member not found',
        result: null,
      });
    }
    return this.appointmentPlanInfra.getOwnedAppointmentPlan(memberId, this.entityManager);
  }
}
