import { Get, Controller, Param, UseGuards } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';

import { AuthGuard } from '~/auth/auth.guard';
import { APIException } from '~/api.excetion';

import { ReportService } from './report.service';
import { GetReportDTO } from './report.type';
import { Local } from '~/decorator';
import { JwtMember } from '~/auth/auth.dto';

@UseGuards(AuthGuard)
@Controller({
  path: 'report',
  version: ['2'],
})
export class ReportController {
  constructor(
    private readonly reportService: ReportService,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}

  @Get('/:reportId')
  async getReportSignedUrl(@Local('member') member: JwtMember, @Param('reportId') reportId: string) {
    if (!reportId || reportId === 'null' || reportId === 'undefined') {
      throw new APIException({
        code: 'E_INVALID_REPORT_ID',
        message: 'Invalid report ID provided',
      });
    }

    const report: GetReportDTO = await this.reportService.getReportById(reportId);
    const { type, options } = report;
    const { appId, memberId, role } = member;

    // 查詢該用戶的權限組
    const memberPermissionGroups = await this.getMemberPermissionGroups(memberId);

    let result;
    switch (type) {
      case 'metabase':
        result = this.reportService.prepareMetabaseUrl(appId, memberId, role, options, memberPermissionGroups);
        break;
      default:
        throw new APIException({ code: 'E_REPORT_TYPE_ERROR', message: 'report type not found' });
    }

    return { code: 'SUCCESS', message: 'get url success', result };
  }

  private async getMemberPermissionGroups(memberId: string): Promise<string[]> {
    try {
      const memberPermissionGroups = await this.entityManager.query(
        `
        SELECT mpg.permission_group_id 
        FROM member_permission_group mpg
        WHERE mpg.member_id = $1
      `,
        [memberId],
      );

      return memberPermissionGroups.map(row => row.permission_group_id);
    } catch (error) {
      return [];
    }
  }
}