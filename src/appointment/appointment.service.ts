import { Injectable } from '@nestjs/common';
import { AppointmentInfrastructure } from './appointment.infra';
import { EntityManager } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';

@Injectable()
export class AppointmentService {
  constructor(
    private readonly appointmentInfraStructure: AppointmentInfrastructure,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}

  getAppointmentEnrollmentByCreatorId(creatorId: string) {
    return this.appointmentInfraStructure.getAppointmentEnrollmentByCreatorId(creatorId, this.entityManager);
  }
}
