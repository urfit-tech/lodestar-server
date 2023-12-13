import { EntityManager } from 'typeorm';
import { faker } from '@faker-js/faker';
import { Category } from '~/definition/entity/category.entity';

export const createTestCategory = async (
  entityManager: EntityManager,
  overrides: Partial<Category> = {},
): Promise<Category> => {
  const overrideRequireColumns = ['appId', 'class'];

  overrideRequireColumns.forEach((column) => {
    if (!overrides[column]) {
      throw new Error(`factory ActivitySession: "${column}" property must be provided`);
    }
  });

  const category = new Category();
  category.appId = overrides.appId;
  category.class = overrides.class;
  category.filterable = overrides.filterable || true;
  category.name = overrides.name || faker.lorem.word();
  category.position = 1;

  await entityManager.save(category);
  return category;
};
