import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { IProductFactory } from '../../interfaces/product.interface';
import { ProgramPlanInfrastructure } from '~/program/program-plan/program-plan.infra';
import { ProductInfrastructure } from '../../product.infra';
import { TokenInfrastructure } from '../../token/token.infra';
import { OrderProductStruct, ProgramPlanModel } from '../../domain/product.model';
import { AppInfrastructure } from '~/app/app.infra';

@Injectable()
export class ProgramPlanFactory implements IProductFactory {
  constructor(
    private programPlanInfra: ProgramPlanInfrastructure,
    private productInfra: ProductInfrastructure,
    private appInfrastructure: AppInfrastructure,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}

  async createProduct(id: string): Promise<OrderProductStruct> {
    const programPlan = await this.programPlanInfra.getProgramPlanById(id, this.entityManager);

    const productGiftPlan = await this.productInfra.getProductGiftPlanByProductId(
      `ProgramPlan_${programPlan.id}`,
      this.entityManager,
    );

    const isProductGiftPlanAvailable = this.isGiftPlanActive(productGiftPlan);

    let gifts = [];
    if (isProductGiftPlanAvailable && productGiftPlan.giftPlan.giftPlanProducts) {
      gifts = await Promise.all(
        productGiftPlan.giftPlan.giftPlanProducts.map(async (giftPlanProduct) => {
          const gift = await this.productInfra.getGiftById(giftPlanProduct.product.target, this.entityManager);
          return {
            id: gift.id,
            type: giftPlanProduct.product.type,
            title: gift.title,
            coverUrl: gift.coverUrl,
            isDeliverable: gift.isDeliverable,
            price: gift.price,
            currencyId: gift.currencyId,
          };
        }),
      );
    }

    const currencyId = programPlan.currency.id || 'TWD';

    const currencyPrice =
      programPlan?.soldAt && new Date() < new Date(programPlan.soldAt)
        ? programPlan.salePrice ?? programPlan.listPrice
        : programPlan.listPrice;

    const options = {};

    const productGiftPlanData = {
      id: productGiftPlan?.id,
      title: productGiftPlan?.giftPlan.title,
      gifts: gifts,
    };

    const appSettings = this.appInfrastructure.getAppSettings(programPlan.program.appId, this.entityManager);

    return new ProgramPlanModel(
      programPlan,
      currencyId,
      currencyPrice,
      options,
      productGiftPlanData,
      appSettings['coin.exchange_rate'],
    );
  }

  private isGiftPlanActive(giftPlan): boolean {
    if (!giftPlan) return false;

    const now = Date.now();
    const hasStarted = !giftPlan.startedAt || now >= new Date(giftPlan.startedAt).getTime();
    const hasNotEnded = !giftPlan.endedAt || now <= new Date(giftPlan.endedAt).getTime();

    return hasStarted && hasNotEnded;
  }
}
