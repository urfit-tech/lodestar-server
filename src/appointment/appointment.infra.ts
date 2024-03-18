import { EntityManager } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { AppointmentEnrollmentView } from '~/entity/AppointmentEnrollmentView';

@Injectable()
export class AppointmentInfrastructure {
  async getAppointmentEnrollmentByCreatorId(creatorId: string, manager: EntityManager) {
    const appointmentEnrollmentRepo = manager.getRepository(AppointmentEnrollmentView);

    return appointmentEnrollmentRepo.find({ where: { creatorId } });
  }
}
