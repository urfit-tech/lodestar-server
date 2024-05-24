import { Controller, Get, Logger, Query, UseGuards } from '@nestjs/common';
import { APIException } from '~/api.excetion';
import { JwtMember } from '~/auth/auth.dto';
import { AuthGuard } from '~/auth/auth.guard';
import { Local } from '~/decorator';
import {
  FetchMemberRightActivityTicketDTO,
  FetchMemberRightActivityTicketQuery,
  MemberRightActivityTicketDataDto,
} from './dto/equity-activity-ticket.dto';
import { ActivityTicketService } from '~/activity/activity-ticket/activity-ticket.service';
import { ProgramService } from '~/program/program.service';

@UseGuards(AuthGuard)
@Controller({
  path: 'equity',
  version: '2',
})
export class EquityController {
  constructor(
    private logger: Logger,
    private readonly activityTicketService: ActivityTicketService,
    private programService: ProgramService,
  ) {}

  @Get('/activity_ticket')
  public async memberRightActivityTicket(
    @Query() dto: FetchMemberRightActivityTicketDTO,
    @Local('member') member: JwtMember,
  ): Promise<MemberRightActivityTicketDataDto> {
    const { memberId, role } = member;

    // Use memberId from params for app-owners (verified identity), otherwise use token memberId for security.
    const targetActivityTicketMemberId = role === 'app-owner' ? dto.memberId : memberId;

    const queryDto = new FetchMemberRightActivityTicketQuery();
    queryDto.activityTicketId = dto.activityTicketId;
    queryDto.sessionId = dto.sessionId;
    queryDto.memberId = targetActivityTicketMemberId;

    try {
      return await this.activityTicketService.memberRightActivityTicket(queryDto);
    } catch (error) {
      const errorMessage = `Error fetching activity collection: ${error.message}`;
      console.error(errorMessage);

      throw new APIException({
        code: 'E_NOT_FOUND',
        message: `Activity ticket data not found, activity_ticket_id: ${dto.activityTicketId}, member_id: ${memberId}, session_id ${dto.sessionId}`,
      });
    }
  }

  @Get('/programs')
  async getProgramsByMemberId(@Local('member') member: JwtMember, @Query('memberId') memberId: string) {
    return this.programService.getProgramsByMemberId(member.appId, String(memberId || member.memberId));
  }
}
