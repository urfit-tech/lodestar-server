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
            getClient: jest.fn(() => ({ get: mockGet, set: mockSet })),
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

  it('should call getAppointmentEnrollmentByCreatorId when cached events are not found and tasks are empty', async () => {
    const memberId = '123';
    mockGet.mockResolvedValue(null);

    const getMemberTasksByExecutorIdMock = jest.fn().mockResolvedValue([]);
    memberService.getMemberTasksByExecutorId = getMemberTasksByExecutorIdMock;

    const mockAppointments = [
      {
        uid: 'appointment1',
        start: [2023, 4, 17, 10, 0],
        end: [2023, 4, 17, 11, 0],
        title: 'Test Appointment',
        description: 'This is a test appointment',
      },
    ];

    const getAppointmentEnrollmentByCreatorIdMock = jest.fn().mockResolvedValue(
      mockAppointments.map((appointment) => ({
        orderProductId: appointment.uid,
        startedAt: new Date(
          appointment.start[0],
          appointment.start[1],
          appointment.start[2],
          appointment.start[3],
          appointment.start[4],
        ),
        endedAt: new Date(
          appointment.end[0],
          appointment.end[1],
          appointment.end[2],
          appointment.end[3],
          appointment.end[4],
        ),
        orderProductName: appointment.title,
        order_product_description: appointment.description,
      })),
    );
    appointmentService.getAppointmentEnrollmentByCreatorId = getAppointmentEnrollmentByCreatorIdMock;

    const result = await service.getCalendarEventsByMemberId(memberId);

    expect(result).toEqual([
      {
        uid: 'appointment1',
        start: [2023, 5, 17, 10, 0], // please note that the month here is 5 because months in JavaScript are zero-indexed
        end: [2023, 5, 17, 11, 0],
        title: 'Test Appointment',
        description: 'This is a test appointment',
      },
    ]);

    expect(mockGet).toHaveBeenCalledWith(`calendar_${memberId}`);
    expect(memberService.getMemberTasksByExecutorId).toHaveBeenCalledWith(memberId);
    expect(appointmentService.getAppointmentEnrollmentByCreatorId).toHaveBeenCalledWith(memberId);
  });
});
