import { EntityManager, MoreThan } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { App } from '~/app/entity/app.entity';
import { CoinLog } from '~/entity/CoinLog';
import { CoinStatus } from '~/entity/CoinStatus';
import { AppSetting } from '~/app/entity/app_setting.entity';
import { Member } from '~/member/entity/member.entity';
import { Coupon } from '~/coupon/entity/coupon.entity';
import { Voucher } from '~/voucher/entity/voucher.entity';
import { PointLog } from '~/entity/PointLog';

@Injectable()
export class DiscountInfrastructure {
  async getById(appId: string, manager: EntityManager): Promise<App> {
    const appRepo = manager.getRepository(App);
    return appRepo.findOne({
      where: { id: appId },
      relations: { appDefaultPermissions: true },
    });
  }

  async getRemainingCoins(memberId: string, manager: EntityManager): Promise<CoinStatus[]> {
    const coinStatusRepo = manager.getRepository(CoinStatus);

    return coinStatusRepo.find({
      where: {
        memberId: memberId,
        remaining: MoreThan(0),
      },
      order: {
        coinLog: { endedAt: 'ASC' },
      },
      relations: ['coinLog'],
    });
  }

  async getAppSettingByMemberId(memberId: string, manager: EntityManager): Promise<Array<AppSetting>> {
    const member = await manager.getRepository(Member).findOne({ where: { id: memberId } });
    if (!member) {
      throw new Error(
        `Member with ID ${memberId} not found in the database. Please check if the ID is correct or if the member exists.`,
      );
    }

    const appSettingRepo = manager.getRepository(AppSetting);
    const founds = await appSettingRepo.findBy({ appId: member.appId });
    return founds;
  }

  async getCouponById(id: string, manager: EntityManager) {
    return await manager.getRepository(Coupon).findOne({
      where: { id },
      relations: [
        'member',
        'couponCode',
        'couponCode.couponPlan',
        'couponCode.couponPlan.couponPlanProducts',
        'couponStatus',
      ],
    });
  }

  async getVoucherById(id: string, manager: EntityManager) {
    return await manager.getRepository(Voucher).findOne({ where: { id }, relations: ['voucherCode', 'voucherPlan'] });
  }

  async getRemaingPoints(id: string, manager: EntityManager) {
    const pointRepo = await manager.getRepository(PointLog);
    return pointRepo.find({ where: { memberId: id } });
  }
}
