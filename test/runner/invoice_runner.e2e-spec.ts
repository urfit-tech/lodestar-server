import dayjs from 'dayjs';
import { v4 } from 'uuid';
import { EntityManager, Repository } from 'typeorm';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { RunnerModule } from '~/runner/runner.module';
import { InvoiceRunner } from '~/runner/invoice.runner';
import { Runner } from '~/runner/runner';
import { PaymentLog } from '~/payment/payment_log.entity';
import { OrderLog } from '~/order/entity/order_log.entity';
import { Member } from '~/entity/Member';
import { App } from '~/entity/App';
import { AppPlan } from '~/entity/AppPlan';
import { Role } from '~/entity/Role';

describe('InvoiceRunner (e2e)', () => {
  let application: INestApplication;
  let manager: EntityManager;
  let roleRepo: Repository<Role>;
  let appPlanRepo: Repository<AppPlan>;
  let appRepo: Repository<App>;
  let memberRepo: Repository<Member>;
  let orderLogRepo: Repository<OrderLog>;
  let paymentLogRepo: Repository<PaymentLog>;

  let role = new Role();
  role.name = 'app-owner';

  let appPlan = new AppPlan();
  appPlan.id = v4();
  appPlan.name = 'test-plan';
  appPlan.description = 'test plan description';

  let app = new App();
  app.id = 'test';
  app.symbol = 'TST';
  app.appPlan = appPlan;

  let appSecrets = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        RunnerModule.forRoot({
          workerName: InvoiceRunner.name,
          nodeEnv: 'Test',
          clazz: InvoiceRunner,
          noGo: true,
        }),
      ],
    }).compile();

    application = moduleFixture.createNestApplication();

    manager = application.get<EntityManager>('phdbEntityManager');
    roleRepo = manager.getRepository(Role);
    appPlanRepo = manager.getRepository(AppPlan);
    appRepo = manager.getRepository(App);
    memberRepo = manager.getRepository(Member);
    orderLogRepo = manager.getRepository(OrderLog);
    paymentLogRepo = manager.getRepository(PaymentLog);
    
    await paymentLogRepo.delete({});
    await orderLogRepo.delete({});
    await memberRepo.delete({});
    await appRepo.delete({});
    await appPlanRepo.delete({});
    await roleRepo.delete({});

    await roleRepo.save(role);
    await appPlanRepo.save(appPlan);
    await appRepo.save(app);

    await application.init();
  });

  afterAll(async () => {
    const manager = application.get<EntityManager>('phdbEntityManager');
    const roleRepo = manager.getRepository(Role);
    const appPlanRepo = manager.getRepository(AppPlan);
    const appRepo = manager.getRepository(App);
    const memberRepo = manager.getRepository(Member);
    const orderLogRepo = manager.getRepository(OrderLog);
    const paymentLogRepo = manager.getRepository(PaymentLog);

    await paymentLogRepo.delete({});
    await orderLogRepo.delete({});
    await memberRepo.delete({});
    await appRepo.delete({});
    await appPlanRepo.delete({});
    await roleRepo.delete({});

    await application.close();
  });

  it('Should raise error since given app is not allow to use invoice module', async () => {
    const invoiceRunner = application.get<InvoiceRunner>(Runner);
    const notAllowedApp = new App();
    notAllowedApp.id = 'not-allowed-app';
    notAllowedApp.symbol = 'NAL';
    notAllowedApp.appPlan = appPlan;

    const givenMember = new Member();
    givenMember.id = v4();
    givenMember.app = notAllowedApp;
    givenMember.email = 'given-member@example.com';
    givenMember.username = 'given-member';
    givenMember.role = role.name;

    const givenOrder = new OrderLog();
    givenOrder.member = givenMember;
    givenOrder.invoiceOptions = {};

    const givenPayment = new PaymentLog();
    givenPayment.no = 'payment_no';
    givenPayment.order = givenOrder;
    givenPayment.status = 'SUCCESS';
    givenPayment.paidAt = dayjs.utc().subtract(10, 'hour').toDate();
    givenPayment.price = 1;
    givenPayment.gateway = 'spgateway';
    givenPayment.invoiceIssuedAt = null;
    givenPayment.invoiceOptions = {};

    await appRepo.save(notAllowedApp);
    await memberRepo.save(givenMember);
    await orderLogRepo.save(givenOrder);
    await paymentLogRepo.save(givenPayment);

    await expect(invoiceRunner.execute()).rejects.toEqual(new Error(JSON.stringify([
      { 'appId': notAllowedApp.id, 'error': 'Not allowed to use invoice module.'},
    ])));

    await paymentLogRepo.remove(givenPayment);
    await orderLogRepo.remove(givenOrder);
    await memberRepo.remove(givenMember);
    await appRepo.remove(notAllowedApp);
  });
});
