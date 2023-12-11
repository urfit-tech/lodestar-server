import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getEntityManagerToken } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { v4 } from 'uuid';

import { App } from '~/app/entity/app.entity';
import { ApplicationModule } from '~/application.module';
import { AppointmentPlan } from '~/entity/AppointmentPlan';
import { AppPlan } from '~/entity/AppPlan';
import { Currency } from '~/entity/Currency';
import { Product } from '~/entity/Product';
import { Role } from '~/entity/Role';
import { Member } from '~/member/entity/member.entity';
import { OrderService } from '~/order/order.service';
import { OrderLog } from '~/order/entity/order_log.entity';
import { OrderProduct } from '~/order/entity/order_product.entity';

import { app, appPlan, currency, role } from '../data';

describe('OrderService (e2e)', () => {
  let application: INestApplication;
  let service: OrderService;
  let manager: EntityManager;

  let appointmentPlanRepo: Repository<AppointmentPlan>;
  let appPlanRepo: Repository<AppPlan>;
  let appRepo: Repository<App>;
  let currencyRepo: Repository<Currency>;
  let memberRepo: Repository<Member>;
  let orderLogRepo: Repository<OrderLog>;
  let orderProductRepo: Repository<OrderProduct>;
  let productRepo: Repository<Product>;
  let roleRepo: Repository<Role>;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();

    application = moduleFixture.createNestApplication();
    service = application.get(OrderService);
    manager = application.get<EntityManager>(getEntityManagerToken());

    appointmentPlanRepo = manager.getRepository(AppointmentPlan);
    appPlanRepo = manager.getRepository(AppPlan);
    appRepo = manager.getRepository(App);
    currencyRepo = manager.getRepository(Currency);
    memberRepo = manager.getRepository(Member);
    orderLogRepo = manager.getRepository(OrderLog);
    orderProductRepo = manager.getRepository(OrderProduct);
    productRepo = manager.getRepository(Product);
    roleRepo = manager.getRepository(Role);

    await appointmentPlanRepo.delete({});
    await orderProductRepo.delete({});
    await orderLogRepo.delete({});
    await productRepo.delete({});
    await memberRepo.delete({});
    await roleRepo.delete({});
    await currencyRepo.delete({});
    await appRepo.delete({});
    await appPlanRepo.delete({});

    await appPlanRepo.save(appPlan);
    await appRepo.save(app);
    await roleRepo.save(role);
    await currencyRepo.save(currency);
    await application.init();
  });

  afterEach(async () => {
    await appointmentPlanRepo.delete({});
    await orderProductRepo.delete({});
    await orderLogRepo.delete({});
    await productRepo.delete({});
    await memberRepo.delete({});
    await roleRepo.delete({});
    await currencyRepo.delete({});
    await appRepo.delete({});
    await appPlanRepo.delete({});
    await application.close();
  });

  describe('Method getOrderProductsByMemberId', () => {
    const member = new Member();
    member.id = v4();
    member.appId = app.id;
    member.email = 'owner@example.com';
    member.username = 'owner';
    member.role = role.name;
    member.name = 'firstMember';

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
    orderProduct.price = 20;
    orderProduct.currency = currency;

    it('Should get order products with specified memberId', async () => {
      await memberRepo.save(member);
      await orderLogRepo.save(orderLog);
      await appointmentPlanRepo.save(appointmentPlan);
      await orderProductRepo.save(orderProduct);
      await productRepo.save(appointmentPlanProduct);

      const orderProducts: OrderProduct[] = await service.getOrderProductsByMemberId(member.id);
      expect(orderProducts.length).toBe(1);
      expect(orderProducts[0].orderId).toBe(orderLog.id);
    });
  });
});
