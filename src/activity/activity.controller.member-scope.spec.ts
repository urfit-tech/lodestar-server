import { UnauthorizedException } from '@nestjs/common';
import { ActivityController } from './activity.controller';
import { ActivityService } from './activity.service';

describe('ActivityController member scoping', () => {
  let appService: { getAppInfoByHost: jest.Mock };
  let activityService: { getActivityByMemberId: jest.Mock; getAllActivityTicketEnrollment: jest.Mock };
  let authService: { verify: jest.Mock };
  let controller: ActivityController;
  const logger = { log: jest.fn(), error: jest.fn() };

  const tokens: Record<string, any> = {
    self: { appId: 'appA', memberId: 'self', role: 'general-member', permissions: [] },
    staff: {
      appId: 'appA',
      memberId: 'staff',
      role: 'general-member',
      permissions: ['CHECK_MEMBER_PAGE_ACTIVITY_INFO'],
    },
    owner: { appId: 'appA', memberId: 'owner', role: 'app-owner', permissions: [] },
  };
  const req = (query: Record<string, any>) => ({ query, headers: { host: 'shop.appB.example' } } as any);

  beforeEach(() => {
    appService = { getAppInfoByHost: jest.fn().mockResolvedValue({ id: 'appB' }) };
    activityService = {
      getActivityByMemberId: jest.fn().mockResolvedValue({ id: 'activity1', activityTickets: [] }),
      getAllActivityTicketEnrollment: jest.fn().mockResolvedValue([]),
    };
    authService = {
      verify: jest.fn().mockImplementation((token: string) => {
        if (!tokens[token]) throw new Error('invalid signature');
        return tokens[token];
      }),
    };
    controller = new ActivityController(appService as any, activityService as any, logger as any, authService as any);
  });

  describe('GET /activity/:activity_id', () => {
    it('stays public without a token, using the host app and ignoring ?memberId', async () => {
      await controller.getActivityByMemberId(req({ memberId: 'victim' }), 'activity1');
      expect(activityService.getActivityByMemberId).toHaveBeenCalledWith('activity1', undefined, undefined, 'appB');
    });

    it("returns the caller's own enrollment with a token, scoped to the token app", async () => {
      await controller.getActivityByMemberId(req({ memberId: 'self' }), 'activity1', 'Bearer self');
      expect(appService.getAppInfoByHost).not.toHaveBeenCalled();
      expect(activityService.getActivityByMemberId).toHaveBeenCalledWith('activity1', 'self', undefined, 'appA');
    });

    it("ignores another member's id for a general member", async () => {
      await controller.getActivityByMemberId(req({ memberId: 'victim' }), 'activity1', 'Bearer self');
      expect(activityService.getActivityByMemberId).toHaveBeenCalledWith('activity1', 'self', undefined, 'appA');
    });

    it('lets activity-info staff and the app owner pass another member id', async () => {
      await controller.getActivityByMemberId(req({ memberId: 'victim' }), 'activity1', 'Bearer staff');
      await controller.getActivityByMemberId(req({ memberId: 'victim' }), 'activity1', 'Bearer owner');
      expect(activityService.getActivityByMemberId.mock.calls.map(call => call[1])).toEqual(['victim', 'victim']);
    });

    it('rejects an invalid or malformed token', async () => {
      await expect(controller.getActivityByMemberId(req({}), 'activity1', 'Bearer forged')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      await expect(controller.getActivityByMemberId(req({}), 'activity1', 'Basic abc')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(activityService.getActivityByMemberId).not.toHaveBeenCalled();
    });
  });

  describe('GET /activity', () => {
    it("uses the token member and app, ignoring another member's id", async () => {
      await controller.getAllActivityByMemberId(tokens.self, req({ memberId: 'victim' }));
      expect(activityService.getAllActivityTicketEnrollment).toHaveBeenCalledWith('self', 'appA');
    });

    it('lets activity-info staff read another member of the same app', async () => {
      await controller.getAllActivityByMemberId(tokens.staff, req({ memberId: 'victim' }));
      expect(activityService.getAllActivityTicketEnrollment).toHaveBeenCalledWith('victim', 'appA');
    });

    it('defaults to the caller when no memberId is given', async () => {
      await controller.getAllActivityByMemberId(tokens.owner, req({}));
      expect(activityService.getAllActivityTicketEnrollment).toHaveBeenCalledWith('owner', 'appA');
    });
  });
});

describe('ActivityService.getActivityByMemberId without a member', () => {
  it('skips the enrollment query and returns tickets without order ids', async () => {
    const activityInfra = {
      getPublishedActivity: jest.fn().mockResolvedValue({
        id: 'activity1',
        activityTickets: [
          {
            id: 'ticket1',
            isPublished: true,
            deletedAt: null,
            endedAt: 1,
            price: '100',
            activitySessionTickets: [],
          },
        ],
      }),
      getActivityTicketEnrollment: jest.fn(),
      getActivityTicketEnrollmentCount: jest.fn().mockResolvedValue([]),
    };
    const service = new ActivityService({} as any, activityInfra as any);
    const result = await service.getActivityByMemberId('activity1', undefined, false, 'appA');
    expect(activityInfra.getActivityTicketEnrollment).not.toHaveBeenCalled();
    expect(result.activityTickets[0]).toMatchObject({ id: 'ticket1', orderId: null, orderProductId: null });
  });
});
