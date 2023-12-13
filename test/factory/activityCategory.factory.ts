import { EntityManager } from 'typeorm';
import { faker } from '@faker-js/faker';
import { ActivityCategory } from '~/activity/entity/ActivityCategory';

export const createTestActivityCategory = async (
  entityManager: EntityManager,
  overrides: Partial<ActivityCategory> = {},
): Promise<ActivityCategory> => {
  const overrideRequireColumns = ['activity', 'category'];

  overrideRequireColumns.forEach((column) => {
    if (!overrides[column]) {
      throw new Error(`factory ActivitySession: "${column}" property must be provided`);
    }
  });

  const activityCategory = new ActivityCategory();
  activityCategory.activity = overrides.activity;
  activityCategory.category = overrides.category;
  activityCategory.position = 1;

  await entityManager.save(activityCategory);
  return activityCategory;
};
