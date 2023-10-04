import { EntityManager, FindOptionsWhere } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Voucher } from './entity/voucher.entity';

@Injectable()
export class VoucherInfrastructure {
  async getVouchersByConditions(conditions: FindOptionsWhere<Voucher>, manager: EntityManager) {
    const voucher = manager.getRepository(Voucher);
    const vouchers = await voucher.find({
      where: {
        ...(conditions && { ...conditions }),
      },
      relations: {
        voucherCode: {
          voucherPlan: true,
        },
      },
    });
    return vouchers;
  }
}
