import { EntityManager } from 'typeorm';
import { ActivitySession } from '~/activity/entity/ActivitySession';
import { Activity } from '~/activity/entity/Activity';
import { faker } from '@faker-js/faker';

export const createTestActivitySession = async (
  entityManager: EntityManager,
  overrides: Partial<ActivitySession> = {},
): Promise<ActivitySession> => {
  const overrideRequireColumns = ['activity'];

  overrideRequireColumns.forEach((column) => {
    if (!overrides[column]) {
      throw new Error(`factory ActivitySession: "${column}" property must be provided`);
    }
  });

  const activitySession = new ActivitySession();
  activitySession.activity = overrides.activity;
  activitySession.startedAt = overrides.startedAt || new Date('2020-01-01T00:00:00Z');
  activitySession.endedAt = overrides.endedAt || new Date('2020-01-02T00:00:00Z');
  activitySession.title = overrides.title || faker.lorem.slug();
  activitySession.location = overrides.location || '';
  activitySession.description = overrides.description || faker.lorem.slug();

  await entityManager.save(activitySession);
  return activitySession;
};
