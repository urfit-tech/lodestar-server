import { EntityManager } from 'typeorm';
import { faker } from '@faker-js/faker';
import { Property } from '~/definition/entity/property.entity';
import { v4 } from 'uuid';

export const createTestProperty = async (
  entityManager: EntityManager,
  overrides: Partial<Property> = {},
): Promise<Property> => {
  const overrideRequireColumns = ['appId'];

  overrideRequireColumns.forEach((column) => {
    if (!overrides[column]) {
      throw new Error(`factory Property: "${column}" property must be provided`);
    }
  });

  const property = new Property();
  property.id = v4();
  property.appId = overrides.appId;
  property.name = overrides.name || faker.lorem.word();
  property.position = overrides.position || 1;
  property.type = overrides.type || 'member';

  await entityManager.save(property);

  return property;
};
