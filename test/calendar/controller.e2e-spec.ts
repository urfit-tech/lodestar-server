import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getEntityManagerToken } from '@nestjs/typeorm';
import { createEvent } from 'ics';
import request from 'supertest';
import { EntityManager, Repository } from 'typeorm';
import { v4 } from 'uuid';

import { ApiExceptionFilter } from '~/api.filter';
import { ApplicationModule } from '~/application.module';
import { App } from '~/app/entity/app.entity';
import { AppHost } from '~/app/entity/app_host.entity';
import { AppSecret } from '~/app/entity/app_secret.entity';
import { AppSetting } from '~/app/entity/app_setting.entity';
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

import { role, app, appPlan, appSecret, appSetting, appHost, currency } from '../data';

describe('CanlendarController (e2e)', () => {
  let application: INestApplication;
  let cacheService: CacheService;
  let manager: EntityManager;
  let roleRepo: Repository<Role>;
  let appPlanRepo: Repository<AppPlan>;
  let appRepo: Repository<App>;
  let appHostRepo: Repository<AppHost>;
  let appSecretRepo: Repository<AppSecret>;
  let appSettingRepo: Repository<AppSetting>;
  let appointmentPlanRepo: Repository<AppointmentPlan>;
  let currencyRepo: Repository<Currency>;
  let memberRepo: Repository<Member>;
  let memberTaskRepo: Repository<MemberTask>;
  let orderLogRepo: Repository<OrderLog>;
  let orderProductRepo: Repository<OrderProduct>;
  let productRepo: Repository<Product>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();

    application = module.createNestApplication();
    application.useGlobalPipes(new ValidationPipe()).useGlobalFilters(new ApiExceptionFilter());
    cacheService = application.get(CacheService);
    manager = application.get<EntityManager>(getEntityManagerToken());
    roleRepo = manager.getRepository(Role);
    appPlanRepo = manager.getRepository(AppPlan);
    appRepo = manager.getRepository(App);
    appHostRepo = manager.getRepository(AppHost);
    appSecretRepo = manager.getRepository(AppSecret);
    appSettingRepo = manager.getRepository(AppSetting);
    appointmentPlanRepo = manager.getRepository(AppointmentPlan);
    currencyRepo = manager.getRepository(Currency);
    memberRepo = manager.getRepository(Member);
    memberTaskRepo = manager.getRepository(MemberTask);
    orderLogRepo = manager.getRepository(OrderLog);
    orderProductRepo = manager.getRepository(OrderProduct);
    productRepo = manager.getRepository(Product);

    await appointmentPlanRepo.delete({});
    await orderProductRepo.delete({});
    await orderLogRepo.delete({});
    await productRepo.delete({});
    await memberTaskRepo.delete({});
    await memberRepo.delete({});
    await currencyRepo.delete({});
    await appSettingRepo.delete({});
    await appSecretRepo.delete({});
    await appHostRepo.delete({});
    await appRepo.delete({});
    await appPlanRepo.delete({});
    await roleRepo.delete({});
    await cacheService.getClient().flushall();

    await currencyRepo.save(currency);
    await roleRepo.save(role);
    await appPlanRepo.save(appPlan);
    await appRepo.save(app);
    await appHostRepo.save(appHost);
    await appSecretRepo.save(appSecret);
    await appSettingRepo.save(appSetting);

    await application.init();
  });

  afterEach(async () => {
    await appointmentPlanRepo.delete({});
    await orderProductRepo.delete({});
    await orderLogRepo.delete({});
    await productRepo.delete({});
    await memberTaskRepo.delete({});
    await memberRepo.delete({});
    await currencyRepo.delete({});
    await appHostRepo.delete({});
    await appSettingRepo.delete({});
    await appSecretRepo.delete({});
    await appRepo.delete({});
    await appPlanRepo.delete({});
    await roleRepo.delete({});
    await cacheService.getClient().flushall();
    await application.close();
  });

  describe('/calendars/:memberId (GET)', () => {
    it('Should get no result with fake member id successfully', async () => {
      const response = await request(application.getHttpServer())
        .get('/calendars/fake_member_id')
        .set('host', appHost.host)
        .expect(200);
      expect(response.headers['content-type']).toEqual('text/calendar; charset=utf-8');
      expect(response.headers['content-disposition']).toEqual('attachment; filename="fake_member_id.ics"');
    });

    const member = new Member();
    member.id = v4();
    member.appId = app.id;
    member.email = 'calendar@example.com';
    member.username = 'calendar';
    member.role = role.name;
    member.name = 'calendar user';

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

    it('Should get member task calendar with member id successfully', async () => {
      await memberRepo.save(member);
      await memberTaskRepo.save(memberTask);

      const response = await request(application.getHttpServer())
        .get(`/calendars/${member.id}`)
        .set('host', appHost.host)
        .expect(200);

      expect(response.headers['content-type']).toEqual('text/calendar; charset=utf-8');
      expect(response.headers['content-disposition']).toEqual(`attachment; filename=\"${member.id}.ics\"`);

      const memberCalendar = createEvent({
        start: [2023, 12, 1, 0, 0],
        title: memberTask.title,
        description: memberTask.description,
        duration: { minutes: 0 },
      }).value.split('\r\n');
      const responseText = response.text.split('\r\n');

      for (let i = 0; i < responseText.length; i++) {
        if (!responseText[i].startsWith('UID:')) {
          expect(responseText[i]).toEqual(memberCalendar[i]);
        }
      }
    });

    it('Should get appointment plan calendar with member id successfully', async () => {
      await memberRepo.save(member);
      await orderLogRepo.save(orderLog);
      await appointmentPlanRepo.save(appointmentPlan);
      await orderProductRepo.save(orderProduct);
      await productRepo.save(appointmentPlanProduct);

      const response = await request(application.getHttpServer())
        .get(`/calendars/${member.id}`)
        .set('host', appHost.host)
        .expect(200);

      expect(response.headers['content-type']).toEqual('text/calendar; charset=utf-8');
      expect(response.headers['content-disposition']).toEqual(`attachment; filename=\"${member.id}.ics\"`);

      const memberCalendar = createEvent({
        start: [2023, 12, 2, 1, 0],
        end: [2023, 12, 2, 2, 0],
        title: orderProduct.name,
        description: orderProduct.description,
      }).value.split('\r\n');
      const responseText = response.text.split('\r\n');

      for (let i = 0; i < responseText.length; i++) {
        if (!responseText[i].startsWith('UID:')) {
          expect(responseText[i]).toEqual(memberCalendar[i]);
        }
      }
    });
  });
});
