// factories/product-factory.registry.ts
import { Injectable } from '@nestjs/common';
import { IDiscountFactory } from '../interfaces/discount.interface';

@Injectable()
export class DiscountFactoryRegistry {
  private factories: Map<string, IDiscountFactory> = new Map();

  registerFactory(productType: string, factory: IDiscountFactory) {
    this.factories.set(productType, factory);
  }

  getFactory(productType: string): IDiscountFactory {
    const factory = this.factories.get(productType);
    if (!factory) {
      throw new Error(`No factory registered for product type: ${productType}`);
    }
    return factory;
  }
}
