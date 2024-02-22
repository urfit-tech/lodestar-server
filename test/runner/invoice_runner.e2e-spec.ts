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
import { Member } from '~/member/entity/member.entity';
import { AppPlan } from '~/entity/AppPlan';
import { Role } from '~/entity/Role';
import { AppExtendedModule } from '~/entity/AppExtendedModule';
import { Module } from '~/entity/Module';
import { App } from '~/app/entity/app.entity';
import { AppSecret } from '~/app/entity/app_secret.entity';
import { EzpayClient } from '~/invoice/ezpay_client';
import { Invoice } from '~/invoice/invoice.entity';

import { app, appPlan, role } from '../data';
import { autoRollbackTransaction } from '../utils';
import { getEntityManagerToken } from '@nestjs/typeorm';

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
          nodeEnv: 'test',
          clazz: InvoiceRunner,
          noGo: true,
        }),
      ],
    })
    .overrideProvider(EzpayClient).useValue(ezpayClient)
    .compile();

    application = moduleFixture.createNestApplication();

    manager = application.get<EntityManager>(getEntityManagerToken());
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
    givenPayment.invoiceGatewayId = v4()

    await autoRollbackTransaction(manager, async (manager) => {
      await manager.save(notAllowedApp);
      await manager.save(givenMember);
      await manager.save(givenOrder);
      await manager.save(givenPayment);

      await expect(invoiceRunner.execute(manager)).rejects.toEqual(new Error(JSON.stringify([
        { 'error': `App: ${notAllowedApp.id} invoice module is not enable or missing setting/secrets.` },
      ])));
      await expect(invoiceRunner.execute(manager)).rejects.toEqual(new Error(JSON.stringify([
        { 'error': `App: ${notAllowedApp.id} invoice module is not enable or missing setting/secrets.` },
      ])));

      const orderLog = await manager.getRepository(OrderLog).findOneBy({ paymentLogs: { no: givenPayment.no } });
        const paymentLog = await manager.getRepository(PaymentLog).findOneBy({ no: givenPayment.no });
        for (const each of [orderLog, paymentLog]) {
          expect(each.invoiceIssuedAt).toBeNull();
          expect(each.invoiceOptions['status']).toEqual('LODESTAR_FAIL');
          expect(each.invoiceOptions['reason']).toEqual(`App: ${notAllowedApp.id} invoice module is not enable or missing setting/secrets.`);
          expect(each.invoiceOptions['retry']).toEqual(2);
        }
    });
  });

  describe('Allow use invoice module App', () => {
    afterEach(() => jest.resetAllMocks());

    it('Should issue invoice with success status', async () => {
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

      const appSecretSet = {
        'invoice.merchant_id': 'test_merchant_id',
        'invoice.hash_key': 'test_hash_key0000000000000000000',
        'invoice.hash_iv': 'test_hash_iv0000',
        'invoice.dry_run': 'true',
      };
      
      const appExtendedModule = new AppExtendedModule();
      appExtendedModule.app = app;
      appExtendedModule.module = invoiceModule;

      const member = new Member();
      member.id = v4();
      member.app = app;
      member.email = 'member@example.com';
      member.username = 'member';
      member.role = role.name;
      
      const order = new OrderLog();
      order.member = member;
      order.invoiceOptions = {};
      
      const payment = new PaymentLog();
      payment.no = 'payment_no';
      payment.order = order;
      payment.status = 'SUCCESS';
      payment.paidAt = dayjs.utc().subtract(10, 'hour').toDate();
      payment.price = 1;
      payment.gateway = 'spgateway';
      payment.invoiceIssuedAt = null;
      payment.invoiceOptions = {};
      payment.invoiceGatewayId = v4()
      
      await autoRollbackTransaction(manager, async (manager) => {
        for (const key in appSecretSet) {
          const secret = new AppSecret();
          secret.app = app;
          secret.key = key;
          secret.value = appSecretSet[key];
          await manager.save(secret);
        }
        await manager.save(appExtendedModule);
        await manager.save(member);
        await manager.save(order);
        await manager.save(payment);

        await invoiceRunner.execute(manager);
        
        const orderLog = await manager.getRepository(OrderLog).findOneBy({ paymentLogs: { no: payment.no } });
        const paymentLog = await manager.getRepository(PaymentLog).findOneBy({ no: payment.no });
        for (const each of [orderLog, paymentLog]) {
          expect(each.invoiceIssuedAt).not.toBeNull();
          expect(each.invoiceOptions).toMatchObject({
            status: 'SUCCESS',
            invoiceNumber: 'invoice_number',
            invoiceTransNo: 'invoice_trans_no',
          });
        }
      });
    });

    it('Should not issue invoice with fail status', async () => {
      ezpayClient.issue.mockImplementationOnce(() => {
        return {
          Status: 'LIB_SOMETHING_FAIL',
          Message: 'fail message',
          Result: {},
        };
      });

      const invoiceRunner = application.get<InvoiceRunner>(Runner);

      const appSecretSet = {
        'invoice.merchant_id': 'test_merchant_id',
        'invoice.hash_key': 'test_hash_key0000000000000000000',
        'invoice.hash_iv': 'test_hash_iv0000',
        'invoice.dry_run': 'true',
      };
      
      const appExtendedModule = new AppExtendedModule();
      appExtendedModule.app = app;
      appExtendedModule.module = invoiceModule;

      const member = new Member();
      member.id = v4();
      member.app = app;
      member.email = 'to_fail_member@example.com';
      member.username = 'to_fail_member';
      member.role = role.name;
      
      const order = new OrderLog();
      order.member = member;
      order.invoiceOptions = {};
      
      const payment = new PaymentLog();
      payment.no = 'to_fail_payment_no';
      payment.order = order;
      payment.status = 'SUCCESS';
      payment.paidAt = dayjs.utc().subtract(10, 'hour').toDate();
      payment.price = 1;
      payment.gateway = 'spgateway';
      payment.invoiceIssuedAt = null;
      payment.invoiceOptions = {};
      payment.invoiceGatewayId = v4()
      
      await autoRollbackTransaction(manager, async (manager) => {
        for (const key in appSecretSet) {
          const secret = new AppSecret();
          secret.app = app;
          secret.key = key;
          secret.value = appSecretSet[key];
          await manager.save(secret);
        }
        await manager.save(appExtendedModule);
        await manager.save(member);
        await manager.save(order);
        await manager.save(payment);

        await invoiceRunner.execute(manager);
        
        const orderLog = await manager.getRepository(OrderLog).findOneBy({ paymentLogs: { no: payment.no } });
        const paymentLog = await manager.getRepository(PaymentLog).findOneBy({ no: payment.no });
        for (const each of [orderLog, paymentLog]) {
          expect(each.invoiceIssuedAt).toBeNull();
          expect(each.invoiceOptions['status']).toEqual('LIB_SOMETHING_FAIL');
          expect(each.invoiceOptions['reason']).toEqual('fail message');
        }
      });
    });

    it('Should not contains PaymentLog less than 3 days', async () => {
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

      const appSecretSet = {
        'invoice.merchant_id': 'test_merchant_id',
        'invoice.hash_key': 'test_hash_key0000000000000000000',
        'invoice.hash_iv': 'test_hash_iv0000',
        'invoice.dry_run': 'true',
      };
      
      const appExtendedModule = new AppExtendedModule();
      appExtendedModule.app = app;
      appExtendedModule.module = invoiceModule;

      const member = new Member();
      member.id = v4();
      member.app = app;
      member.email = 'member@example.com';
      member.username = 'member';
      member.role = role.name;
      
      const order = new OrderLog();
      order.member = member;
      order.invoiceOptions = {};
      
      const payment = new PaymentLog();
      payment.no = 'to_fail_payment_no';
      payment.order = order;
      payment.status = 'SUCCESS';
      payment.paidAt = dayjs.utc().subtract(4, 'day').toDate();
      payment.price = 1;
      payment.gateway = 'spgateway';
      payment.invoiceIssuedAt = null;
      payment.invoiceOptions = {};
      payment.invoiceGatewayId = v4()
      
      await autoRollbackTransaction(manager, async (manager) => {
        for (const key in appSecretSet) {
          const secret = new AppSecret();
          secret.app = app;
          secret.key = key;
          secret.value = appSecretSet[key];
          await manager.save(secret);
        }
        await manager.save(appExtendedModule);
        await manager.save(member);
        await manager.save(order);
        await manager.save(payment);

        await invoiceRunner.execute(manager);
        
        const orderLog = await manager.getRepository(OrderLog).findOneBy({ paymentLogs: { no: payment.no } });
        const paymentLog = await manager.getRepository(PaymentLog).findOneBy({ no: payment.no });
        for (const each of [orderLog, paymentLog]) {
          expect(each.invoiceIssuedAt).toBeNull();
          expect(each.invoiceOptions['status']).toBeUndefined();
          expect(each.invoiceOptions['reason']).toBeUndefined();
        }
      });
    });

    it('Should success with retry with 2 times at most 5 times', async () => {
      const success = {
        Status: 'SUCCESS',
          Message: 'message',
          Result: {
            InvoiceNumber: 'retry_success_invoice_number',
            InvoiceTransNo: 'retry_success_invoice_trans_no',
          },
      };
      const libSomethingFail = {
        Status: 'LIB_SOMETHING_FAIL',
        Message: 'fail message',
        Result: {},
      };
      const libShouldNotAppearFail = {
        Status: 'LIB_SHOULD_NOT_APPEAR_FAIL',
        Message: 'should not appear fail message',
        Result: {},
      };
      ezpayClient.issue
        .mockImplementationOnce(() => libSomethingFail)
        .mockImplementationOnce(() => success)
        .mockImplementationOnce(() => libShouldNotAppearFail);

      const invoiceRunner = application.get<InvoiceRunner>(Runner);
      
      const appSecretSet = {
        'invoice.merchant_id': 'test_merchant_id',
        'invoice.hash_key': 'test_hash_key0000000000000000000',
        'invoice.hash_iv': 'test_hash_iv0000',
        'invoice.dry_run': 'true',
      };
      
      const appExtendedModule = new AppExtendedModule();
      appExtendedModule.app = app;
      appExtendedModule.module = invoiceModule;

      const member = new Member();
      member.id = v4();
      member.app = app;
      member.email = 'retry_success_member@example.com';
      member.username = 'retry_success_member';
      member.role = role.name;
      
      const order = new OrderLog();
      order.member = member;
      order.invoiceOptions = {};
      
      const payment = new PaymentLog();
      payment.no = 'retry_success_payment_no';
      payment.order = order;
      payment.status = 'SUCCESS';
      payment.paidAt = dayjs.utc().subtract(10, 'hour').toDate();
      payment.price = 1;
      payment.gateway = 'spgateway';
      payment.invoiceIssuedAt = null;
      payment.invoiceOptions = {};
      payment.invoiceGatewayId = v4()
      
      await autoRollbackTransaction(manager, async (manager) => {
        for (const key in appSecretSet) {
          const secret = new AppSecret();
          secret.app = app;
          secret.key = key;
          secret.value = appSecretSet[key];
          await manager.save(secret);
        }
        await manager.save(appExtendedModule);
        await manager.save(member);
        await manager.save(order);
        await manager.save(payment);

        await invoiceRunner.execute(manager);
        const failedOrderLog = await manager.getRepository(OrderLog).findOneBy({ paymentLogs: { no: payment.no } });
        const failedPaymentLog = await manager.getRepository(PaymentLog).findOneBy({ no: payment.no });
        for (const { invoiceOptions } of [failedOrderLog, failedPaymentLog]) {
          expect(invoiceOptions).toMatchObject({
            status: 'LIB_SOMETHING_FAIL',
            reason: 'fail message',
            retry: 1,
          });
        }
        await invoiceRunner.execute(manager);
        await invoiceRunner.execute(manager);
        await invoiceRunner.execute(manager);
        await invoiceRunner.execute(manager);

        const orderLog = await manager.getRepository(OrderLog).findOneBy({ paymentLogs: { no: payment.no } });
        const paymentLog = await manager.getRepository(PaymentLog).findOneBy({ no: payment.no });
        for (const { invoiceIssuedAt, invoiceOptions } of [orderLog, paymentLog]) {
          expect(invoiceIssuedAt).not.toBeNull();
          expect(invoiceOptions).toMatchObject({
            status: 'SUCCESS',
            retry: 2,
            invoiceNumber: 'retry_success_invoice_number',
            invoiceTransNo: 'retry_success_invoice_trans_no',
          });
        }
      });
    });

    it('Should fail with retry at most 5 times', async () => {
      const libSomethingFail = {
        Status: 'LIB_SOMETHING_FAIL',
        Message: 'fail message',
        Result: {},
      };
      const libAnotherFail = {
        Status: 'LIB_ANOTHER_FAIL',
        Message: 'another fail message',
        Result: {},
      };
      const libShouldNotAppearFail = {
        Status: 'LIB_SHOULD_NOT_APPEAR_FAIL',
        Message: 'should not appear fail message',
        Result: {},
      };
      ezpayClient.issue
        .mockImplementationOnce(() => libSomethingFail)
        .mockImplementationOnce(() => libSomethingFail)
        .mockImplementationOnce(() => libSomethingFail)
        .mockImplementationOnce(() => libSomethingFail)
        .mockImplementationOnce(() => libAnotherFail)
        .mockImplementationOnce(() => libShouldNotAppearFail);

      const invoiceRunner = application.get<InvoiceRunner>(Runner);
      
      const appSecretSet = {
        'invoice.merchant_id': 'test_merchant_id',
        'invoice.hash_key': 'test_hash_key0000000000000000000',
        'invoice.hash_iv': 'test_hash_iv0000',
        'invoice.dry_run': 'true',
      };
      
      const appExtendedModule = new AppExtendedModule();
      appExtendedModule.app = app;
      appExtendedModule.module = invoiceModule;

      const member = new Member();
      member.id = v4();
      member.app = app;
      member.email = 'retry_fail_member@example.com';
      member.username = 'retry_fail_member';
      member.role = role.name;
      
      const order = new OrderLog();
      order.member = member;
      order.invoiceOptions = {};
      
      const payment = new PaymentLog();
      payment.no = 'retry_fail_payment_no';
      payment.order = order;
      payment.status = 'SUCCESS';
      payment.paidAt = dayjs.utc().subtract(10, 'hour').toDate();
      payment.price = 1;
      payment.gateway = 'spgateway';
      payment.invoiceIssuedAt = null;
      payment.invoiceOptions = {};
      payment.invoiceGatewayId = v4()
      
      await autoRollbackTransaction(manager, async (manager) => {
        for (const key in appSecretSet) {
          const secret = new AppSecret();
          secret.app = app;
          secret.key = key;
          secret.value = appSecretSet[key];
          await manager.save(secret);
        }
        await manager.save(appExtendedModule);
        await manager.save(member);
        await manager.save(order);
        await manager.save(payment);

        let failedOrderLog: OrderLog, failedPaymentLog: PaymentLog;
        for (let i = 0; i < 4; i += 1) {
          await invoiceRunner.execute(manager);
          failedOrderLog = await manager.getRepository(OrderLog).findOneBy({ paymentLogs: { no: payment.no } });
          failedPaymentLog = await manager.getRepository(PaymentLog).findOneBy({ no: payment.no });
          for (const { invoiceOptions } of [failedOrderLog, failedPaymentLog]) {
            expect(invoiceOptions).toMatchObject({
              status: 'LIB_SOMETHING_FAIL',
              reason: 'fail message',
              retry: i + 1,
            });
          }
        }
        await invoiceRunner.execute(manager);
        failedOrderLog = await manager.getRepository(OrderLog).findOneBy({ paymentLogs: { no: payment.no } });
        failedPaymentLog = await manager.getRepository(PaymentLog).findOneBy({ no: payment.no });
        for (const { invoiceOptions } of [failedOrderLog, failedPaymentLog]) {
          expect(invoiceOptions).toMatchObject({
            status: 'LIB_ANOTHER_FAIL',
            reason: 'another fail message',
            retry: 5,
          });
        }
        await invoiceRunner.execute(manager);
        const orderLog = await manager.getRepository(OrderLog).findOneBy({ paymentLogs: { no: payment.no } });
        const paymentLog = await manager.getRepository(PaymentLog).findOneBy({ no: payment.no });
        for (const { invoiceIssuedAt, invoiceOptions} of [orderLog, paymentLog]) {
          expect(invoiceIssuedAt).toBeNull();
          expect(invoiceOptions['status']).toEqual('LIB_ANOTHER_FAIL');
          expect(invoiceOptions['retry']).toEqual(5);
        }
      });
    });
  });
});
