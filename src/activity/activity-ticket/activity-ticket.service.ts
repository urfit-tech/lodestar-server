import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import {
  FetchMemberRightActivityTicketQuery,
  MemberRightActivityTicketDataDto,
} from '~/equity/dto/equity-activity-ticket.dto';
import { ActivityTicketInfrastructure } from './activity-ticket.infra';

@Injectable()
export class ActivityTicketService {
  constructor(
    @InjectEntityManager() private readonly entityManager: EntityManager,
    private readonly activityTicketInfra: ActivityTicketInfrastructure,
  ) {}

  async memberRightActivityTicket(dto: FetchMemberRightActivityTicketQuery): Promise<MemberRightActivityTicketDataDto> {
    return this.activityTicketInfra.getActivityTicketInfoByIdAndMemberId(
      this.entityManager,
      dto.activityTicketId,
      dto.memberId,
      dto.sessionId,
    );
  }
}
