import { EntityManager } from 'typeorm';
import { ActivityTicket } from '~/activity/entity/ActivityTicket';
import { Activity } from '~/activity/entity/Activity';
import { faker } from '@faker-js/faker';

export const createTestActivityTicket = async (
  entityManager: EntityManager,
  overrides: Partial<ActivityTicket> = {},
): Promise<ActivityTicket> => {
  const overrideRequireColumns = ['activity'];

  overrideRequireColumns.forEach((column) => {
    if (!overrides[column]) {
      throw new Error(`factory ActivityTicket: "${column}" property must be provided`);
    }
  });

  const activityTicket = new ActivityTicket();
  activityTicket.activity = overrides.activity;
  activityTicket.title = overrides.title || faker.lorem.slug();
  activityTicket.price = overrides.price !== undefined ? overrides.price : 2000;
  activityTicket.count = overrides.count !== undefined ? overrides.count : 100;
  activityTicket.isPublished = overrides.isPublished !== undefined ? overrides.isPublished : true;
  activityTicket.startedAt = overrides.startedAt || new Date('2020-01-01T00:00:00Z');
  activityTicket.endedAt = overrides.endedAt || new Date('2020-01-02T00:00:00Z');
  activityTicket.count = faker.number.int({ min: 10, max: 100 });

  await entityManager.save(activityTicket);

  return activityTicket;
};
