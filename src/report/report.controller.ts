import { Get, Controller, Param, UseGuards } from '@nestjs/common';

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
  constructor(private readonly reportService: ReportService) {}

  @Get('/:reportId')
  async getReportSignedUrl(@Local('member') member: JwtMember, @Param('reportId') reportId: string) {
    const report: GetReportDTO = await this.reportService.getReportById(reportId);
    const { type, options } = report;
    const { appId, memberId, role } = member;

    let result;
    switch (type) {
      case 'metabase':
        const payload = !!Object.keys(options.metabase.resource).includes('dashboard')
          ? {
              ...options.metabase,
              params: {
                appid: appId,
                memberid: memberId,
                role,
              },
            }
          : {
              ...options.metabase,
              params: {
                appId,
                memberId,
                role,
              },
            };

        result = this.reportService.generateMetabaseSignedUrl(payload);
        break;
      default:
        throw new APIException({ code: 'E_REPORT_TYPE_ERROR', message: 'report type not found' });
    }
    return { code: 'SUCCESS', message: 'get url success', result };
  }
}
