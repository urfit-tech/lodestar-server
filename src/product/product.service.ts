import { Injectable, Inject } from '@nestjs/common';
import { ProductFactoryRegistry } from './factories/product-factory.registry';
import { OrderProductStruct, OrderProductStructType } from './domain/product.model';
import { CheckoutOrderDto } from './dto/product.dto';
import { flatten } from 'ramda';
import { DiscountFactoryRegistry } from './factories/discount-factory.registry';
import { Discount } from './domain/discount.model';

type ProductOptions = { [productId: string]: any };

@Injectable()
export class ProductService {
  constructor(
    @Inject('PRODUCT_FACTORIES')
    private readonly productFactoryRegistry: ProductFactoryRegistry,
    @Inject('DISCOUNT_FACTORIES')
    private readonly discountFactoryRegistry: DiscountFactoryRegistry,
  ) {}

  async checkoutOrder(checkoutOrderDto: CheckoutOrderDto) {
    const { appId, memberId, productIds, discountId, options: productOptions, shipping } = checkoutOrderDto;

    // 1. Process products
    const productInstances = await this.getProductInstances(productIds);
    const orderProducts = await this.checkoutOrderProducts(appId, productIds, productInstances, productOptions);
    const orderProductDiscounts = await this.checkoutOrderProductDiscounts(productInstances);

    // 2. Process discounts
    const filteredProductIds = orderProducts.map((product) => product.productId);
    const orderDiscountInstance = await this.getDiscountInstance(discountId, orderProducts);
    const orderDiscounts = await orderDiscountInstance.checkout(memberId, filteredProductIds, productOptions);

    // Combine product discounts with order discounts
    const concatOrderProductDiscount = orderDiscounts.concat(orderProductDiscounts);

    return { orderProducts, orderDiscounts: concatOrderProductDiscount };
  }

  private async getProductInstances(productIds: string[]): Promise<OrderProductStruct[]> {
    return Promise.all(productIds.map((id) => this.getProductInstance(id)));
  }

  private async getProductInstance(productId: string): Promise<OrderProductStruct> {
    const [type, target] = productId.split('_');
    const factory = this.productFactoryRegistry.getFactory(type);
    if (!factory) {
      throw new Error(`Product factory not found for type: ${type}`);
    }
    return factory.createProduct(target);
  }

  private async checkoutOrderProducts(
    appId: string,
    productIds: string[],
    productInstances: OrderProductStruct[],
    productOptions: ProductOptions,
  ): Promise<OrderProductStructType[]> {
    const results = await Promise.all(
      productInstances.map((instance, idx) => instance.checkout(appId, productOptions[productIds[idx]])),
    );
    return results.filter(notNull);
  }

  private async checkoutOrderProductDiscounts(productInstances: OrderProductStruct[]): Promise<any[]> {
    const discounts = await Promise.all(productInstances.map((instance) => instance.checkoutDiscounts()));
    return flatten(discounts);
  }

  private async getDiscountInstance(
    discountId: string | undefined,
    products: OrderProductStructType[],
  ): Promise<Discount> {
    if (!discountId) {
      throw new Error('Discount ID is required');
    }

    const [type, target] = discountId.split('_');
    const factory = this.discountFactoryRegistry.getFactory(type);
    if (!factory) {
      throw new Error(`Discount factory not found for type: ${type}`);
    }
    return factory.createDiscount(target, products);
  }
}

// Utility function
function notNull<T>(value: T | null): value is T {
  return value !== null;
}
