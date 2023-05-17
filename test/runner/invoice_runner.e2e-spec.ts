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
import { AppExtendedModule } from '~/entity/AppExtendedModule';
import { Module } from '~/entity/Module';
import { AppSecret } from '~/app/entity/app_secret.entity';

import { app, appPlan, role } from '../data';
import { EzpayClient } from '~/invoice/ezpay_client';
import { Invoice } from '~/invoice/invoice.entity';

describe('InvoiceRunner (e2e)', () => {
  let application: INestApplication;
  let ezpayClient = {
    issue: jest.fn(),
  };

  let manager: EntityManager;
  let moduleRepo: Repository<Module>;
  let roleRepo: Repository<Role>;
  let appPlanRepo: Repository<AppPlan>;
  let appExtendedModuleRepo: Repository<AppExtendedModule>;
  let appRepo: Repository<App>;
  let appSecretRepo: Repository<AppSecret>;
  let memberRepo: Repository<Member>;
  let orderLogRepo: Repository<OrderLog>;
  let paymentLogRepo: Repository<PaymentLog>;
  let invoiceRepo: Repository<Invoice>;

  let invoiceModule: Module;

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
    })
    .overrideProvider(EzpayClient).useValue(ezpayClient)
    .compile();

    application = moduleFixture.createNestApplication();

    manager = application.get<EntityManager>('phdbEntityManager');
    moduleRepo = manager.getRepository(Module);
    roleRepo = manager.getRepository(Role);
    appPlanRepo = manager.getRepository(AppPlan);
    appExtendedModuleRepo = manager.getRepository(AppExtendedModule);
    appRepo = manager.getRepository(App);
    appSecretRepo = manager.getRepository(AppSecret);
    memberRepo = manager.getRepository(Member);
    orderLogRepo = manager.getRepository(OrderLog);
    paymentLogRepo = manager.getRepository(PaymentLog);
    invoiceRepo = manager.getRepository(Invoice);
    
    await invoiceRepo.delete({});
    await paymentLogRepo.delete({});
    await orderLogRepo.delete({});
    await memberRepo.delete({});
    await appSecretRepo.delete({});
    await appExtendedModuleRepo.delete({});
    await appRepo.delete({});
    await appPlanRepo.delete({});
    await roleRepo.delete({});

    await roleRepo.save(role);
    await appPlanRepo.save(appPlan);
    await appRepo.save(app);

    invoiceModule = await moduleRepo.findOneBy({ id: 'invoice' });
    await application.init();
  });

  afterAll(async () => {
    await invoiceRepo.delete({});
    await paymentLogRepo.delete({});
    await orderLogRepo.delete({});
    await memberRepo.delete({});
    await appSecretRepo.delete({});
    await appExtendedModuleRepo.delete({});
    await appRepo.delete({});
    await appPlanRepo.delete({});
    await roleRepo.delete({});

    await application.close();
  });

  afterEach(() => jest.clearAllMocks());

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

  describe('Allow use invoice module App', () => {
    beforeAll(async () => {
      const appSecretSet = {
        'invoice.merchant_id': 'test_merchant_id',
        'invoice.hash_key': 'test_hash_key0000000000000000000',
        'invoice.hash_iv': 'test_hash_iv0000',
        'invoice.dry_run': 'true',
      };
      for (const key in appSecretSet) {
        const secret = new AppSecret();
        secret.app = app;
        secret.key = key;
        secret.value = appSecretSet[key];
        await appSecretRepo.save(secret);
      }

      const appExtendedModule = new AppExtendedModule();
      appExtendedModule.app = app;
      appExtendedModule.module = invoiceModule;
      await appExtendedModuleRepo.save(appExtendedModule);
    });

    it('Should create invoice with success status', async () => {
      ezpayClient.issue.mockImplementationOnce(() => {
        return {
          Status: 'SUCCESS',
          Message: 'message',
          Result: {
            InvoiceNumber: 'invoice_number',
            InvoiceTransNo: 'invoice_trans_no',
          },
        };
      });

      const invoiceRunner = application.get<InvoiceRunner>(Runner);
      const member = new Member();
      member.id = v4();
      member.app = app;
      member.email = 'member@example.com';
      member.username = 'member';
      member.role = role.name;
      await memberRepo.save(member);

      const order = new OrderLog();
      order.member = member;
      order.invoiceOptions = {};
      await orderLogRepo.save(order);

      const payment = new PaymentLog();
      payment.no = 'payment_no';
      payment.order = order;
      payment.status = 'SUCCESS';
      payment.paidAt = dayjs.utc().subtract(10, 'hour').toDate();
      payment.price = 1;
      payment.gateway = 'spgateway';
      payment.invoiceIssuedAt = null;
      payment.invoiceOptions = {};
      await paymentLogRepo.save(payment);
      
      await invoiceRunner.execute();
      
      const orderLog = await orderLogRepo.findOneBy({ paymentLogs: { no: payment.no } });
      const paymentLog = await paymentLogRepo.findOneBy({ no: payment.no });
      for (const each of [orderLog, paymentLog]) {
        expect(each.invoiceIssuedAt).not.toBeNull();
        expect(each.invoiceOptions).toMatchObject({
          status: 'SUCCESS',
          invoiceNumber: 'invoice_number',
          invoiceTransNo: 'invoice_trans_no',
        });
      }
    });

    it('Should not invoice with fail status', async () => {
      ezpayClient.issue.mockImplementationOnce(() => {
        return {
          Status: 'LIB_SOMETHING_FAIL',
          Message: 'fail message',
          Result: {},
        };
      });

      const invoiceRunner = application.get<InvoiceRunner>(Runner);
      const member = new Member();
      member.id = v4();
      member.app = app;
      member.email = 'to_fail_member@example.com';
      member.username = 'to_fail_member';
      member.role = role.name;
      await memberRepo.save(member);

      const order = new OrderLog();
      order.member = member;
      order.invoiceOptions = {};
      await orderLogRepo.save(order);

      const payment = new PaymentLog();
      payment.no = 'to_fail_payment_no';
      payment.order = order;
      payment.status = 'SUCCESS';
      payment.paidAt = dayjs.utc().subtract(10, 'hour').toDate();
      payment.price = 1;
      payment.gateway = 'spgateway';
      payment.invoiceIssuedAt = null;
      payment.invoiceOptions = {};
      await paymentLogRepo.save(payment);
      

      await expect(invoiceRunner.execute()).rejects.toEqual(new Error(JSON.stringify([
        { 'appId': app.id, 'error': 'fail message' },
      ])));
      
      const orderLog = await orderLogRepo.findOneBy({ paymentLogs: { no: payment.no } });
      const paymentLog = await paymentLogRepo.findOneBy({ no: payment.no });
      for (const each of [orderLog, paymentLog]) {
        expect(each.invoiceIssuedAt).toBeNull();
        expect(each.invoiceOptions['status']).toEqual('LIB_SOMETHING_FAIL');
      }
    });
  });
});
