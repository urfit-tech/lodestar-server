import { Get, Controller, Param, UseGuards } from '@nestjs/common';
import { APIException } from '~/api.excetion';
import { ReportService } from './report.service';
import { GetReportDTO } from './report.type';
import { AuthGuard } from '~/auth/auth.guard';
@UseGuards(AuthGuard)
@Controller({
  path: 'report',
  version: ['2'],
})
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('/:reportId')
  async getReportSignedUrl(@Param('reportId') reportId: string) {
    const report: GetReportDTO = await this.reportService.getReportById(reportId);
    const { type, options } = report;

    let result;
    switch (type) {
      case 'metabase':
        const payload = options.metabase;
        result = this.reportService.generateMetabaseSignedUrl(payload);
        break;
      default:
        throw new APIException({ code: 'E_REPORT_TYPE_ERROR', message: 'report type not found' });
    }
    return { code: 'SUCCESS', message: 'get url success', result };
  }
}
