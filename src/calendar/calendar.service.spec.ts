import { Test, TestingModule } from '@nestjs/testing';
import { EventAttributes } from 'ics';
import { v4 } from 'uuid';

import { CalendarService } from './calendar.service';
import { CouponInfrastructure } from '~/coupon/coupon.infra';
import { DefinitionInfrastructure } from '~/definition/definition.infra';
import { MemberTask } from '~/entity/MemberTask';
import { MemberInfrastructure } from '~/member/member.infra';
import { MemberService } from '~/member/member.service';
import { OrderProduct } from '~/order/entity/order_product.entity';
import { OrderInfrastructure } from '~/order/order.infra';
import { OrderService } from '~/order/order.service';
import { ProductInfrastructure } from '~/product/product.infra';
import { SharingCodeInfrastructure } from '~/sharingCode/sharingCode.infra';
import { VoucherInfrastructure } from '~/voucher/voucher.infra';
import { CacheService } from '~/utility/cache/cache.service';

describe('CalendarService', () => {
  let service: CalendarService;
  const mockCacheService = {
    getClient: () => ({
      get: jest.fn().mockReturnValue(new Promise((resolve) => resolve(null))),
      set: jest.fn(),
    }),
  };
  const mockMemberService = { getMemberTasks: jest.fn() };
  const mockOrderService = { getOrderProductsByMemberId: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        CalendarService,
        CouponInfrastructure,
        DefinitionInfrastructure,
        MemberInfrastructure,
        {
          provide: MemberService,
          useValue: mockMemberService,
        },
        OrderInfrastructure,
        {
          provide: OrderService,
          useValue: mockOrderService,
        },
        ProductInfrastructure,
        SharingCodeInfrastructure,
        VoucherInfrastructure,
      ],
    }).compile();

    service = module.get<CalendarService>(CalendarService);
  });

  afterEach(() => jest.resetAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Method getCalendarEventsByMemberId', () => {
    it('should return an array of calendar events', async () => {
      const memberTask = new MemberTask();
      const mockTaskTitle = 'Mock member task';
      const mockTaskDescription = 'Mock member task description';
      memberTask.memberId = v4();
      memberTask.title = mockTaskTitle;
      memberTask.description = mockTaskDescription;
      memberTask.status = 'pending';
      memberTask.dueAt = new Date('2023-12-01T00:00:00.000000');

      const insertedOrderProduct = new OrderProduct();
      insertedOrderProduct.name = 'product_name';
      insertedOrderProduct.startedAt = new Date('2023-12-02T02:00:00.000000');
      insertedOrderProduct.endedAt = new Date('2023-12-02T03:00:00.000000');

      const memberTasks: MemberTask[] = [memberTask];
      const orderProducts: OrderProduct[] = [insertedOrderProduct];
      mockMemberService.getMemberTasks.mockReturnValue(new Promise((resolve) => resolve(memberTasks)));
      mockOrderService.getOrderProductsByMemberId.mockReturnValue(new Promise((resolve) => resolve(orderProducts)));

      const events: EventAttributes[] = await service.getCalendarEventsByMemberId('fake_member_id');
      expect(events.length).toEqual(2);
      expect(events[0].start).toEqual([2023, 12, 1, 0, 0]);
      expect(events[0].title).toEqual(mockTaskTitle);
      expect(events[0].description).toEqual(mockTaskDescription);
      expect(events[1].start).toEqual([2023, 12, 2, 2, 0]);
    });
  });
});
