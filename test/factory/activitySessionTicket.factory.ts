import { EntityManager } from 'typeorm';
import { ActivitySessionTicket } from '~/activity/entity/ActivitySessionTicket';
import { ActivitySession } from '~/activity/entity/ActivitySession';
import { ActivityTicket } from '~/activity/entity/ActivityTicket';

export const createTestActivitySessionTicket = async (
  entityManager: EntityManager,
  overrides: Partial<ActivitySessionTicket> = {},
): Promise<ActivitySessionTicket> => {
  const overrideRequireColumns = ['activitySession', 'activityTicket'];

  overrideRequireColumns.forEach((column) => {
    if (!overrides[column]) {
      throw new Error(`factory ActivitySessionTicket: "${column}" property must be provided`);
    }
  });

  const sessionTicket = new ActivitySessionTicket();
  sessionTicket.activitySession = overrides.activitySession;
  sessionTicket.activityTicket = overrides.activityTicket;
  sessionTicket.activitySessionType = overrides.activitySessionType || 'offline';

  await entityManager.save(sessionTicket);
  return sessionTicket;
};
