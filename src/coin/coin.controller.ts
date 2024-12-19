import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtMember } from '~/auth/auth.dto';
import { AuthGuard } from '~/auth/auth.guard';
import { Local } from '~/decorator';
import { InjectQueue } from '@nestjs/bull';
import { ImporterTasker, ImportJob } from '~/tasker/importer.tasker';
import { Queue } from 'bull';
import { CoinImportDTO } from './coin.dto';
import { PermissionGuard } from '~/auth/permission.guard';
import { PermissionSet } from '~/enums/PermissionSet.enum';
import { Permissions } from '~/decorators/permissions.decorator';

const MEMBER_PERMISSION_GROUP_ADMIN: PermissionSet[] = [
  PermissionSet.MEMBER_ADMIN,
  PermissionSet.POST_ADMIN,
  PermissionSet.SALES_RECORDS_NORMAL,
  PermissionSet.SALES_RECORDS_ADMIN,
  PermissionSet.PROGRAM_ADMIN,
  PermissionSet.PROGRAM_PACKAGE_TEMPO_DELIVERY_ADMIN,
  PermissionSet.APPOINTMENT_PLAN_ADMIN,
  PermissionSet.COIN_ADMIN,
  PermissionSet.SALES_LEAD_SELECTOR_ADMIN,
  PermissionSet.SHIPPING_ADMIN,
  PermissionSet.SHIPPING_NORMAL,
  PermissionSet.MEMBER_PHONE_ADMIN,
  PermissionSet.PROJECT_PORTFOLIO_ADMIN,
  PermissionSet.SALES_PERFORMANCE_ADMIN,
  PermissionSet.SALES_LEAD_ADMIN,
  PermissionSet.SALES_LEAD_NORMAL,
  PermissionSet.MATERIAL_AUDIT_LOG_ADMIN,
];

@UseGuards(AuthGuard, PermissionGuard)
@Controller({
  path: 'coins',
  version: '2',
})
export class CoinController {
  constructor(@InjectQueue(ImporterTasker.name) private readonly importerQueue: Queue) {}

  @Post('import')
  @Permissions(...MEMBER_PERMISSION_GROUP_ADMIN)
  public async importCoins(@Local('member') member: JwtMember, @Body() metadata: CoinImportDTO): Promise<void> {
    const { memberId: invokerMemberId } = member;

    const { appId, fileInfos } = metadata;
    const importJob: ImportJob = {
      appId,
      invokerMemberId,
      category: 'coin',
      fileInfos: fileInfos.map(({ key, checksum }) => ({
        checksumETag: checksum,
        fileName: key,
      })),
    };
    await this.importerQueue.add(importJob, { removeOnComplete: true, removeOnFail: true });
  }
}
