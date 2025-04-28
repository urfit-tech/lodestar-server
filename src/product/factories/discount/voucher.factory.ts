import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { IDiscountFactory } from '~/product/interfaces/discount.interface';
import { Discount, VoucherDiscount } from '~/product/domain/discount.model';
import { OrderProductStructType } from '~/product/domain/product.model';
import { DiscountInfrastructure } from '~/product/discount.infra';

@Injectable()
export class VoucherFactory implements IDiscountFactory {
  constructor(
    private readonly discountInfra: DiscountInfrastructure,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}

  async createDiscount(id: string, products: OrderProductStructType[]): Promise<Discount> {
    const voucher = await this.discountInfra.getVoucherById(id, this.entityManager);

    return new VoucherDiscount({
      id,
      name: `【兌換券】${voucher.voucherCode.voucherPlan.title}`,
      description: voucher.voucherCode.voucherPlan.description,
      voucher,
      products,
    });
  }
}
