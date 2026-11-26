import { EntityManager } from 'typeorm';
import { ActivityInfrastructure } from './activity.infra';

describe('ActivityInfrastructure.getPublishedActivity', () => {
  it('selects the activity deletedAt so the storefront can treat a deleted activity as not found', async () => {
    const deletedAt = new Date('2025-01-16T03:10:00Z');
    const findOne = jest.fn().mockResolvedValue({ id: 'activity-1', title: 'title', deletedAt, activityTickets: [] });
    const manager = { getRepository: jest.fn().mockReturnValue({ findOne }) } as unknown as EntityManager;
    const infra = new ActivityInfrastructure({ convertObjectKeysToCamelCase: (obj: any) => obj } as any);

    const activity = await infra.getPublishedActivity(manager, 'activity-1', 'app-1');

    const [options] = findOne.mock.calls[0];
    expect(options.where).toEqual({ id: 'activity-1', appId: 'app-1' });
    expect(options.select.deletedAt).toBe(true);
    expect(activity).toHaveProperty('deletedAt', deletedAt);
  });
});
