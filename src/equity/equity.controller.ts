import { Controller, Get, Logger, Query, UseGuards } from '@nestjs/common';
import { ActivityService } from '~/activity/activity.service';
import { FetchMemberRightActivityTicketDTO, FetchMemberRightActivityTicketQuery, MemberRightActivityTicketDataDto } from '~/activity/dto/member-right-activity-ticket.dto';
import { APIException } from '~/api.excetion';
import { JwtMember } from '~/auth/auth.dto';
import { AuthGuard } from '~/auth/auth.guard';
import { Local } from '~/decorator';


@UseGuards(AuthGuard)
@Controller({
  path: 'equity',
  version: '2',
})
export class EquityController {
  constructor(private logger: Logger, private readonly activityService: ActivityService) {}

  @Get('/activity_ticket')
  public async memberRightActivityTicket(
    @Query() dto: FetchMemberRightActivityTicketDTO,
    @Local('member') member: JwtMember
  ): Promise<MemberRightActivityTicketDataDto>{
    const { memberId } = member;

    const queryDto = new FetchMemberRightActivityTicketQuery()
    queryDto.activityTicketId = dto.activityTicketId
    queryDto.sessionId = dto.sessionId
    queryDto.memberId = memberId

    try {
      return await this.activityService.memberRightActivityTicket(queryDto);

    } catch (error) {
      const errorMessage = `Error fetching activity collection: ${error.message}`;
      console.error(errorMessage)

      throw new APIException({
        code: 'E_NOT_FOUND',
        message: `Activity ticket data not found, activity_ticket_id: ${dto.activityTicketId}, member_id: ${memberId}, session_id ${dto.sessionId}`,
      });
    }
  }
}
