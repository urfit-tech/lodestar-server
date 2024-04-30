import { Test, TestingModule } from '@nestjs/testing';
import { ActivityService } from './activity.service';
import { ActivityInfrastructure } from './activity.infra';
import { EntityManager } from 'typeorm';

describe('ActivityService', () => {
  let service: ActivityService;
  let mockActivityInfra: Partial<ActivityInfrastructure>;
  let mockEntityManager: Partial<EntityManager>;

  beforeEach(async () => {
    mockActivityInfra = {
      getPublishedActivity: jest.fn() as jest.Mock,
      getActivityTicketEnrollment: jest.fn() as jest.Mock,
      getActivityTicketEnrollmentCount: jest.fn() as jest.Mock,
    };

    mockEntityManager = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityService,
        { provide: ActivityInfrastructure, useValue: mockActivityInfra },
        { provide: EntityManager, useValue: mockEntityManager },
      ],
    }).compile();

    service = module.get<ActivityService>(ActivityService);
  });

  it('should return detailed activity data', async () => {
    const activityId = 'some-activity-id';
    const memberId = 'some-member-id';
    const includeDeleted = false;

    mockActivityInfra.getPublishedActivity = jest.fn().mockResolvedValue({
      id: activityId,
      activityTickets: [
        {
          id: 'ticket-1',
          isPublished: true,
          deletedAt: null,
          activitySessionTickets: [
            {
              activitySession: {
                id: 'session-1',
                startedAt: new Date('2020-01-01T00:00:00Z'),
              },
            },
            {
              activitySession: {
                id: 'session-2',
                startedAt: new Date('2020-01-02T00:00:00Z'),
              },
            },
          ],
        },
      ],
    });

    mockActivityInfra.getActivityTicketEnrollment = jest.fn().mockResolvedValue([{ activityTicketId: 'ticket-1' }]);
    mockActivityInfra.getActivityTicketEnrollmentCount = jest
      .fn()
      .mockResolvedValue([{ activityTicketId: 'ticket-1', participants: 10 }]);

    const result = await service.getActivityByMemberId(activityId, memberId, includeDeleted);

    expect(result).toHaveProperty('id', activityId);
    expect(result.activityTickets).toHaveLength(1);
    expect(result.activityTickets[0]).toHaveProperty('participants', 10);
    expect(mockActivityInfra.getPublishedActivity).toHaveBeenCalledWith(expect.anything(), activityId);
  });
});
