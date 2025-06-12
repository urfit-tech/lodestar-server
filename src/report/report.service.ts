import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityManager } from 'typeorm';
import { APIException } from '~/api.excetion';
import { InjectEntityManager } from '@nestjs/typeorm';
import { sign } from 'jsonwebtoken';
import { Report } from './entity/report.entity';
import { GetReportDTO, MetabasePayload } from './report.type';

@Injectable()
export class ReportService {
  constructor(
    @InjectEntityManager() private readonly entityManager: EntityManager,
    private readonly configService: ConfigService<{ METABASE_SECRET_KEY: string; METABASE_SITE_URL: string }>,
  ) {}

  async getReportById(orderId: string) {
    const reportRepo = this.entityManager.getRepository(Report);
    const report = await reportRepo.findOneBy({ id: orderId });
    if (!report) {
      throw new APIException({ code: 'E_DB_GET_REPORT_NOT_FOUND', message: 'report not found.' });
    }
    return {
      id: report.id,
      appId: report.appId,
      options: report.options,
      type: report.type ? 'metabase' : 'unknown', // TODO: fix type
      title: report.title,
    } as GetReportDTO;
  }

  generateMetabaseSignedUrl(payload: MetabasePayload) {
    const secretKey = this.configService.get('METABASE_SECRET_KEY');
    const siteUrl = this.configService.get('METABASE_SITE_URL');
    const metabaseType = Object.keys(payload.resource)[0] === 'question' ? 'question' : 'dashboard';
    payload.exp = Math.round(Date.now() / 1000) + 10 * 60;
    const token = sign(payload, secretKey);
    const iframeUrl = `${siteUrl}/embed/${metabaseType}/${token}`;
    return iframeUrl;
  }

  prepareMetabaseUrl(
    appId: string,
    memberId: string,
    role: string,
    options: any,
    memberPermissionGroups: string[] = [],
  ): string {
    const permissionGroupsParam = memberPermissionGroups.join(',');

    // 🔍 判斷是否為 dashboard - 需要放在前面
    const isDashboard = !!Object.keys(options.metabase.resource).includes('dashboard');

    console.log('=== prepareMetabaseUrl Debug ===');
    console.log('📥 Input parameters:');
    console.log('  appId:', appId);
    console.log('  memberId:', memberId);
    console.log('  role:', role);
    console.log('  memberPermissionGroups:', memberPermissionGroups);
    console.log('  permissionGroupsParam:', permissionGroupsParam);
    console.log('  isDashboard:', isDashboard);

    console.log('📄 Options object:');
    console.log('  Full options:', JSON.stringify(options, null, 2));
    console.log('  options.canViewSelfDataOnly:', options.canViewSelfDataOnly);
    console.log('  options.canViewGroupDataOnly:', options.canViewGroupDataOnly);

    // 🏗️ 建立基礎參數和條件參數
    const baseParams = this.createBaseParams(appId, isDashboard);
    const conditionalParams = this.createConditionalParams(options, memberId, role, permissionGroupsParam, isDashboard);

    // 🔗 組合最終 payload
    const payload = {
      ...options.metabase,
      params: { ...baseParams, ...conditionalParams },
    };

    console.log('🚀 Final payload:');
    console.log(JSON.stringify(payload, null, 2));

    const url = this.generateMetabaseSignedUrl(payload);
    console.log('🔗 Generated URL:', url);
    console.log('=== prepareMetabaseUrl Debug End ===');

    return url;
  }

  // 🏗️ 建立基礎參數 (appId/appid)
  private createBaseParams(appId: string, isDashboard: boolean) {
    return isDashboard ? { appid: appId } : { appId };
  }

  // 🔧 根據權限設定建立條件參數
  private createConditionalParams(
    options: any,
    memberId: string,
    role: string,
    permissionGroupsParam: string,
    isDashboard: boolean,
  ) {
    const { canViewSelfDataOnly, canViewGroupDataOnly } = options;
    const params: any = {};

    // 🔍 個人數據篩選
    if (canViewSelfDataOnly) {
      console.log('  ✅ Adding SELF filter - member data only');
      if (isDashboard) {
        params.memberid = memberId;
      } else {
        params.memberId = memberId;
      }
      params.role = role;
    }

    // 🔍 組內數據篩選
    if (canViewGroupDataOnly) {
      console.log('  ✅ Adding GROUP filter - group data only');
      params.permissiongroups = permissionGroupsParam;
    }

    // 📝 記錄權限決策
    if (canViewSelfDataOnly && canViewGroupDataOnly) {
      console.log('  ✅ BOTH filters active - self + group data only');
    } else if (canViewSelfDataOnly) {
      console.log('  ✅ SELF filter only - self data only');
    } else if (canViewGroupDataOnly) {
      console.log('  ✅ GROUP filter only - group data only');
    } else {
      console.log('  ❌ NO filters - all data');
    }

    return params;
  }
}
