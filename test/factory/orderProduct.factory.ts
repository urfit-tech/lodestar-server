import { EntityManager } from 'typeorm';
import { OrderProduct } from '~/order/entity/order_product.entity';
import { OrderLog } from '~/order/entity/order_log.entity';
import { Product } from '~/entity/Product';
import { Currency } from '~/entity/Currency';
import { faker } from '@faker-js/faker/locale/af_ZA';

export const createTestOrderProduct = async (
  entityManager: EntityManager,
  overrides: Partial<OrderProduct> = {},
): Promise<OrderProduct> => {
  const overrideRequireColumns = ['order', 'product', 'options'];

  overrideRequireColumns.forEach((column) => {
    if (!overrides[column]) {
      throw new Error(`factory OrderProduct: "${column}" property must be provided`);
    }
  });

  const orderProduct = new OrderProduct();
  orderProduct.order = overrides.order;
  orderProduct.product = overrides.product;
  orderProduct.currency = overrides.currency;
  orderProduct.name = overrides.name || faker.lorem.word(1);
  orderProduct.price = overrides.price !== undefined ? overrides.price : 2000;
  orderProduct.deliveredAt = overrides.deliveredAt || new Date();
  orderProduct.options = overrides.options;
  orderProduct.deliveredAt = overrides.deliveredAt || new Date('2020-01-01T00:00:00Z');

  await entityManager.save(orderProduct);

  return orderProduct;
};
