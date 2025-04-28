import { OrderProductStruct } from '../domain/product.model';

export interface IProductFactory {
  createProduct(id: string): Promise<OrderProductStruct>;
}

export interface IProductFactory {
  createProduct(id: string): Promise<OrderProductStruct>;
}
