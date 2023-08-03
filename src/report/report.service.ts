import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityManager } from 'typeorm';
import { APIException } from '~/api.excetion';
import { InjectEntityManager } from '@nestjs/typeorm';
import { sign } from 'jsonwebtoken';
import { Report } from './entity/report.entity';
import { MetabasePayload } from './report.type';

@Injectable()
export class ReportService {
  constructor(
    @InjectEntityManager() private readonly entityManager: EntityManager,
    private readonly configService: ConfigService<{ METABASE_SECRET_KEY: string; METABASE_SITE_URL: string }>,
  ) {}

  async getReportById(orderId: string) {
    const reportRepo = this.entityManager.getRepository(Report);
    let report;
    try {
      report = await reportRepo.findOneBy({ id: orderId });
    } catch {
      throw new APIException({ code: 'E_DB_GET_REPORT_ERROR', message: 'get report error.' });
    }

    if (!report) {
      throw new APIException({ code: 'E_DB_GET_REPORT_NOT_FOUND', message: 'report not found.' });
    }
    return report;
  }

  generateMetabaseSignedUrl(payload: MetabasePayload) {
    const secretKey = this.configService.get('METABASE_SECRET_KEY');
    const siteUrl = this.configService.get('METABASE_SITE_URL');
    const metabaseType = Object.keys(payload.resource)[0] === 'question' ? 'question' : ' dashboard';
    payload.exp = Math.round(Date.now() / 1000) + 10 * 60;
    const token = sign(payload, secretKey);
    const iframeUrl = `${siteUrl}/embed/${metabaseType}/${token}`;
    return iframeUrl;
  }
}
