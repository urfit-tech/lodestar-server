import { Test, TestingModule } from '@nestjs/testing';
import { CalendarService } from './calendar.service';
import { CacheService } from '~/utility/cache/cache.service';
import { MemberService } from '~/member/member.service';
import { AppointmentService } from '~/appointment/appointment.service';

describe('CalendarService', () => {
  let service: CalendarService;
  let cacheService: CacheService;
  let memberService: MemberService;
  let appointmentService: AppointmentService;
  let mockGet: jest.Mock;
  let mockSet: jest.Mock;

  beforeEach(async () => {
    mockGet = jest.fn();
    mockSet = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalendarService,
        {
          provide: CacheService,
          useValue: {
            getClient: jest.fn(() => ({
              get: mockGet,
              set: mockSet,
            })),
          },
        },
        {
          provide: MemberService,
          useValue: {
            getMemberTasksByExecutorId: jest.fn(),
          },
        },
        {
          provide: AppointmentService,
          useValue: {
            getAppointmentEnrollmentByCreatorId: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CalendarService>(CalendarService);
    cacheService = module.get<CacheService>(CacheService);
    memberService = module.get<MemberService>(MemberService);
    appointmentService = module.get<AppointmentService>(AppointmentService);
  });

  it('should return cached events if they exist', async () => {
    const memberId = '123';
    const mockEvents = [{ uid: 'task1', start: [2023, 5, 17, 10, 0], title: 'Test Task' }];
    mockGet.mockResolvedValue(JSON.stringify(mockEvents));

    const result = await service.getCalendarEventsByMemberId(memberId);

    expect(result).toEqual(mockEvents);
    expect(mockGet).toHaveBeenCalledWith(`calendar_${memberId}`);
    expect(memberService.getMemberTasksByExecutorId).not.toHaveBeenCalled();
    expect(appointmentService.getAppointmentEnrollmentByCreatorId).not.toHaveBeenCalled();
  });
});
