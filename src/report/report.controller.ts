import { Get, Controller, Headers, Param } from '@nestjs/common';
import { verify } from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { APIException } from '~/api.excetion';
import { ReportService } from './report.service';
import { Report } from './report.type';

@Controller({
  path: 'report',
  version: ['2'],
})
export class ReportController {
  constructor(
    private ReportService: ReportService,
    private readonly configService: ConfigService<{ HASURA_JWT_SECRET: string }>,
  ) {}

  @Get('/:reportId')
  async getReportSignedUrl(@Param('reportId') reportId: string, @Headers('Authorization') authorization: string) {
    let result;
    try {
      await verify(authorization.split(' ')[1], this.configService.get('HASURA_JWT_SECRET'));
    } catch {
      throw new APIException({ code: 'E_TOKEN_INVALID', message: 'authToken is invalid' });
    }
    const report: Report = await this.ReportService.getReportById(reportId);
    const { type, options } = report;

    switch (type) {
      case 'metabase':
        const payload = options.metabase;
        result = this.ReportService.generateMetabaseSignedUrl(payload);
        break;
      default:
        throw new APIException({ code: 'E_REPORT_TYPE_ERROR', message: 'report type not found' });
    }
    return { code: 'SUCCESS', message: 'get url success', result };
  }
}
