import { faker } from '@faker-js/faker';
import { EntityManager } from 'typeorm';
import { Activity } from '~/activity/entity/Activity';

export const createTestActivity = async (
  entityManager: EntityManager,
  overrides: Partial<Activity> = {},
): Promise<Activity> => {
  const overrideRequireColumns = ['app', 'organizer'];

  overrideRequireColumns.forEach((column) => {
    if (!overrides[column]) {
      throw new Error(`factory Activity: "${column}" property must be provided`);
    }
  });

  const activity = new Activity();
  activity.title = overrides.title || faker.commerce.productName();
  activity.description = overrides.description || faker.commerce.productDescription();
  activity.isPrivate = overrides.isPrivate !== undefined ? overrides.isPrivate : false;
  activity.app = overrides.app;
  activity.description = faker.lorem.sentence();
  activity.publishedAt = new Date();
  activity.organizer = overrides.organizer;

  await entityManager.save(activity);
  return activity;
};
