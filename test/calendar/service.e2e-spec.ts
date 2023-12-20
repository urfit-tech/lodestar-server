import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getEntityManagerToken } from '@nestjs/typeorm';
import { DurationObject, EventAttributes } from 'ics';
import { EntityManager, Repository } from 'typeorm';
import { v4 } from 'uuid';

import { App } from '~/app/entity/app.entity';
import { ApplicationModule } from '~/application.module';
import { CalendarService } from '~/calendar/calendar.service';
import { AppointmentPlan } from '~/entity/AppointmentPlan';
import { AppPlan } from '~/entity/AppPlan';
import { Currency } from '~/entity/Currency';
import { MemberTask } from '~/entity/MemberTask';
import { Product } from '~/entity/Product';
import { Role } from '~/entity/Role';
import { Member } from '~/member/entity/member.entity';
import { OrderLog } from '~/order/entity/order_log.entity';
import { OrderProduct } from '~/order/entity/order_product.entity';
import { CacheService } from '~/utility/cache/cache.service';

import { app, appPlan, currency, role } from '../data';

describe('CalendarService (e2e)', () => {
  let application: INestApplication;
  let service: CalendarService;
  let cacheService: CacheService;

  let manager: EntityManager;
  let roleRepo: Repository<Role>;
  let currencyRepo: Repository<Currency>;
  let appointmentPlanRepo: Repository<AppointmentPlan>;
  let productRepo: Repository<Product>;
  let memberRepo: Repository<Member>;
  let memberTaskRepo: Repository<MemberTask>;
  let orderLogRepo: Repository<OrderLog>;
  let orderProductRepo: Repository<OrderProduct>;
  let appPlanRepo: Repository<AppPlan>;
  let appRepo: Repository<App>;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();

    application = moduleFixture.createNestApplication();
    service = application.get(CalendarService);
    cacheService = application.get(CacheService);

    manager = application.get<EntityManager>(getEntityManagerToken());
    roleRepo = manager.getRepository(Role);
    currencyRepo = manager.getRepository(Currency);
    appointmentPlanRepo = manager.getRepository(AppointmentPlan);
    productRepo = manager.getRepository(Product);
    memberRepo = manager.getRepository(Member);
    memberTaskRepo = manager.getRepository(MemberTask);
    orderLogRepo = manager.getRepository(OrderLog);
    orderProductRepo = manager.getRepository(OrderProduct);
    appPlanRepo = manager.getRepository(AppPlan);
    appRepo = manager.getRepository(App);

    await roleRepo.delete({});
    await appointmentPlanRepo.delete({});
    await orderProductRepo.delete({});
    await orderLogRepo.delete({});
    await productRepo.delete({});
    await memberTaskRepo.delete({});
    await memberRepo.delete({});
    await currencyRepo.delete({});
    await appRepo.delete({});
    await appPlanRepo.delete({});
    await cacheService.getClient().flushall();

    await appPlanRepo.save(appPlan);
    await appRepo.save(app);
    await roleRepo.save(role);
    await currencyRepo.save(currency);
    await application.init();
  });

  afterEach(async () => {
    await roleRepo.delete({});
    await appointmentPlanRepo.delete({});
    await orderProductRepo.delete({});
    await orderLogRepo.delete({});
    await productRepo.delete({});
    await memberTaskRepo.delete({});
    await memberRepo.delete({});
    await currencyRepo.delete({});
    await cacheService.getClient().flushall();
    await appRepo.delete({});
    await appPlanRepo.delete({});
    await application.close();
  });

  describe('Method getCalendarEventsByMemberId', () => {
    const member = new Member();
    member.id = v4();
    member.appId = app.id;
    member.email = 'owner@example.com';
    member.username = 'owner';
    member.role = role.name;
    member.name = 'firstMember';

    const memberTask = new MemberTask();
    memberTask.memberId = member.id;
    memberTask.title = 'Mock member task';
    memberTask.priority = 'high';
    memberTask.description = 'Mock member task description';
    memberTask.status = 'pending';
    memberTask.dueAt = new Date('2023-12-01T00:00:00.000000');

    const orderLog = new OrderLog();
    orderLog.id = 'TES1234567890';
    orderLog.memberId = member.id;
    orderLog.status = 'SUCCESS';
    orderLog.appId = app.id;
    orderLog.invoiceOptions = {};

    const appointmentPlan = new AppointmentPlan();
    appointmentPlan.id = v4();
    appointmentPlan.creator = member;
    appointmentPlan.title = 'appointment-plan';
    appointmentPlan.description = 'appointment plan description';
    appointmentPlan.price = 1;
    appointmentPlan.duration = 30;
    appointmentPlan.currency = currency;

    const appointmentPlanProduct = new Product();
    appointmentPlanProduct.type = 'AppointmentPlan';
    appointmentPlanProduct.id = `${appointmentPlanProduct.type}_${appointmentPlan.id}`;
    appointmentPlanProduct.target = appointmentPlan.id;

    const orderProduct = new OrderProduct();
    orderProduct.order = orderLog;
    orderProduct.product = appointmentPlanProduct;
    orderProduct.name = 'appointment product';
    orderProduct.description = 'appointment product description';
    orderProduct.price = 20;
    orderProduct.currency = currency;
    orderProduct.startedAt = new Date('2023-12-02T01:00:00.000000');
    orderProduct.endedAt = new Date('2023-12-02T02:00:00.000000');

    it('Should get member task calendar event with specified memberId', async () => {
      await memberRepo.save(member);
      await memberTaskRepo.save(memberTask);

      const events: EventAttributes[] = await service.getCalendarEventsByMemberId(member.id);
      expect(events.length).toBe(1);

      const memberTaskEvent = events[0] as EventAttributes & { duration: DurationObject };
      expect(memberTaskEvent.start).toEqual([2023, 12, 1, 0, 0]);
      expect(memberTaskEvent.duration.minutes).toEqual(0);
      expect(memberTaskEvent.title).toEqual(memberTask.title);
      expect(memberTaskEvent.description).toEqual(memberTask.description);
    });

    it('Should get order product calendar event with specified memberId', async () => {
      await memberRepo.save(member);
      await orderLogRepo.save(orderLog);
      await appointmentPlanRepo.save(appointmentPlan);
      await orderProductRepo.save(orderProduct);
      await productRepo.save(appointmentPlanProduct);

      const events: EventAttributes[] = await service.getCalendarEventsByMemberId(member.id);
      expect(events.length).toBe(1);

      const orderProductEvent = events[0] as EventAttributes & { end: number };
      expect(orderProductEvent.start).toEqual([2023, 12, 2, 1, 0]);
      expect(orderProductEvent.end).toEqual([2023, 12, 2, 2, 0]);
      expect(orderProductEvent.title).toEqual(orderProduct.name);
      expect(orderProductEvent.description).toEqual(orderProduct.description);
    });
  });
});
