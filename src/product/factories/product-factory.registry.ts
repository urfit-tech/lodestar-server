// factories/product-factory.registry.ts
import { Injectable } from '@nestjs/common';
import { IProductFactory } from '../interfaces/product.interface';

@Injectable()
export class ProductFactoryRegistry {
  private factories: Map<string, IProductFactory> = new Map();

  registerFactory(productType: string, factory: IProductFactory) {
    this.factories.set(productType, factory);
  }

  getFactory(productType: string): IProductFactory {
    const factory = this.factories.get(productType);
    if (!factory) {
      throw new Error(`No factory registered for product type: ${productType}`);
    }
    return factory;
  }
}
