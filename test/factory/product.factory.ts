import { EntityManager } from 'typeorm';
import { Product } from '~/entity/Product';

export const createTestProduct = async (
  entityManager: EntityManager,
  overrides: Partial<Product> = {},
): Promise<Product> => {
  const overrideRequireColumns = ['id', 'type', 'target'];

  overrideRequireColumns.forEach((column) => {
    if (!overrides[column]) {
      throw new Error(`factory Product: "${column}" property must be provided`);
    }
  });

  const product = new Product();
  product.id = overrides.id;
  product.type = overrides.type;
  product.target = overrides.target;

  await entityManager.save(product);
  return product;
};
