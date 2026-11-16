import { Get, Controller, Param, UseGuards } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';

import { AuthGuard } from '~/auth/auth.guard';
import { APIException } from '~/api.excetion';

import { ReportService } from './report.service';
import { GetReportDTO } from './report.type';
import { Local } from '~/decorator';
import { JwtMember } from '~/auth/auth.dto';
import { isAppOwnerOrHasAnyPermission } from '~/auth/authorization.helper';
import { PermissionSet } from '~/enums/PermissionSet.enum';

// Same gate as the admin report page (lodestar-app-admin ReportPage / AdminMenu report_collection).
const REPORT_VIEW_PERMISSIONS: PermissionSet[] = [PermissionSet.REPORT_ADMIN, PermissionSet.REPORT_VIEW];
// Bypasses the report's permission-group restriction, as in the admin report page.
const REPORT_GROUP_BYPASS_PERMISSIONS: PermissionSet[] = [PermissionSet.REPORT_ADMIN];

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

    // Another app's report is reported as missing.
    if (!appId || report.appId !== appId) {
      throw new APIException({ code: 'E_DB_GET_REPORT_NOT_FOUND', message: 'report not found.' });
    }
    if (!isAppOwnerOrHasAnyPermission(member, REPORT_VIEW_PERMISSIONS)) {
      throw new APIException({ code: 'E_REPORT_FORBIDDEN', message: 'no permission to view this report' }, 403);
    }

    // 查詢該用戶的權限組
    const memberPermissionGroups = await this.getMemberPermissionGroups(memberId);

    // A report limited to permission groups is visible only to members of one of those groups.
    if (!isAppOwnerOrHasAnyPermission(member, REPORT_GROUP_BYPASS_PERMISSIONS)) {
      const reportPermissionGroupIds = await this.reportService.getReportPermissionGroupIds(report.id);
      if (
        reportPermissionGroupIds.length > 0 &&
        !reportPermissionGroupIds.some(groupId => memberPermissionGroups.includes(groupId))
      ) {
        throw new APIException({ code: 'E_REPORT_FORBIDDEN', message: 'no permission to view this report' }, 403);
      }
    }

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