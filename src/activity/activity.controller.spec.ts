import { Test, TestingModule } from '@nestjs/testing';
import { ActivityController } from './activity.controller';
import { ActivityService } from './activity.service';
import { APIException } from '~/api.excetion';
import { AuthService } from '~/auth/auth.service';
import { AccessControlService } from '~/auth/access-control.service';
import { Logger } from '@nestjs/common';
import { AuthGuard } from '~/auth/auth.guard';
import { PermissionGuard } from '~/auth/permission.guard';

describe('ActivityController', () => {
  let controller: ActivityController;
  let activityService: ActivityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivityController],
      providers: [
        {
          provide: ActivityService,
          useValue: {
            getActivityParticipants: jest.fn(),
          },
        },
        {
          provide: AccessControlService,
          useValue: {
            isAuthorized: jest.fn(),
          },
        },
        {
          provide: AuthService,
          useValue: {
            verify: jest.fn(),
          },
        },
        {
          provide: Logger,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ActivityController>(ActivityController);
    activityService = module.get<ActivityService>(ActivityService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('get participants error', () => {
    beforeEach(() => {
      jest.spyOn(AuthGuard.prototype, 'canActivate').mockReturnValue(true);
      jest.spyOn(PermissionGuard.prototype, 'canActivate').mockReturnValue(true);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should throw an APIException when activityService.getActivityParticipants throws an error', async () => {
      const activityId = 'test-activity-id';
      const errorMessage = 'Test error message';

      jest.spyOn(activityService, 'getActivityParticipants').mockRejectedValue(new Error(errorMessage));

      await expect(controller.getActivityParticipants(activityId)).rejects.toThrowError(APIException);

      try {
        await controller.getActivityParticipants(activityId);
      } catch (error) {
        expect(error).toBeInstanceOf(APIException);
        expect(error).toMatchObject({
          code: 'E_ACTIVITY_GET_PARTICIPANTS',
          message: `Failed to get activity participants: ${errorMessage}`,
          result: null,
        });
      }
    });
  });
});
