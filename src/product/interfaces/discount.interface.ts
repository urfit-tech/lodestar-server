import { Discount } from '../domain/discount.model';
import { OrderProductStructType } from '../domain/product.model';

export interface IDiscountFactory {
  createDiscount(id: string, products: OrderProductStructType[]): Promise<Discount>;
}
