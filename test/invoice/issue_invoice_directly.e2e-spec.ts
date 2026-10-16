import { v4 } from 'uuid';
import { EntityManager, Repository } from 'typeorm';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getEntityManagerToken } from '@nestjs/typeorm';

import { RunnerModule } from '~/runner/runner.module';
import { InvoiceRunner } from '~/runner/invoice.runner';
import { InvoiceService } from '~/invoice/invoice.service';
import { InvoiceExceedsOrderAmountError } from '~/invoice/invoice.error';
import { InvoiceInfo } from '~/invoice/invoice.dto';
import { EzpayClient } from '~/invoice/ezpay_client';
import { Invoice } from '~/invoice/invoice.entity';
import { PaymentLog } from '~/payment/payment_log.entity';
import { OrderLog } from '~/order/entity/order_log.entity';
import { OrderProduct } from '~/order/entity/order_product.entity';
import { Member } from '~/member/entity/member.entity';
import { AppPlan } from '~/entity/AppPlan';
import { Role } from '~/entity/Role';
import { AppExtendedModule } from '~/entity/AppExtendedModule';
import { AppInvoiceGateway } from '~/entity/AppInvoiceGateway';
import { Currency } from '~/entity/Currency';
import { Module } from '~/entity/Module';
import { Product } from '~/entity/Product';
import { App } from '~/app/entity/app.entity';

import { app, appPlan, currency, role } from '../data';
import { autoRollbackTransaction } from '../utils';

describe('InvoiceService.issueInvoiceDirectly order amount limit (e2e)', () => {
  let application: INestApplication;
  let manager: EntityManager;
  let invoiceService: InvoiceService;
  let invoiceModule: Module;
  let currencyRepo: Repository<Currency>;
  let roleRepo: Repository<Role>;
  let appPlanRepo: Repository<AppPlan>;
  let appRepo: Repository<App>;

  const ezpayClient = { issue: jest.fn() };
  const invoiceGatewayId = v4();

  let merchantOrderSeq = 0;
  const invoiceInfo = (totalAmt: number): InvoiceInfo => ({
    MerchantOrderNo: `T${(merchantOrderSeq += 1)}${Date.now()}`,
    BuyerName: 'buyer',
    BuyerEmail: 'buyer@example.com',
    Category: 'B2C',
    TaxType: '3',
    TaxRate: 0,
    Amt: totalAmt,
    TaxAmt: '0',
    TotalAmt: totalAmt,
    PrintFlag: 'Y',
    ItemName: 'tuition',
    ItemCount: '1',
    ItemUnit: '件',
    ItemPrice: `${totalAmt}`,
    ItemAmt: `${totalAmt}`,
    ItemTaxType: '3',
  });

  const mockIssued = (invoiceNumber: string, totalAmt: number) =>
    ezpayClient.issue.mockImplementationOnce(() => ({
      Status: 'SUCCESS',
      Message: 'ok',
      Result: {
        InvoiceNumber: invoiceNumber,
        InvoiceTransNo: `trans-${invoiceNumber}`,
        RandomNum: '1234',
        TotalAmt: totalAmt,
      },
    }));

  // an order of `productPrices`, paid `paid` (0 = unpaid), with `invoices` already issued
  const givenOrder = async (
    manager: EntityManager,
    {
      productPrices,
      paid,
      invoices = [],
    }: { productPrices: number[]; paid: number; invoices?: Array<Partial<Invoice>> },
  ) => {
    const appExtendedModule = new AppExtendedModule();
    appExtendedModule.app = app;
    appExtendedModule.module = invoiceModule;
    await manager.save(appExtendedModule);

    const appInvoiceGateway = new AppInvoiceGateway();
    appInvoiceGateway.app = app;
    appInvoiceGateway.gatewayId = invoiceGatewayId;
    appInvoiceGateway.options = {
      'invoice.merchant_id': 'test_merchant_id',
      'invoice.hash_key': 'test_hash_key0000000000000000000',
      'invoice.hash_iv': 'test_hash_iv0000',
      'invoice.dry_run': 'true',
    };
    await manager.save(appInvoiceGateway);

    const member = new Member();
    member.id = v4();
    member.app = app;
    member.email = 'member@example.com';
    member.username = 'member';
    member.role = role.name;
    await manager.save(member);

    const order = new OrderLog();
    order.id = `TST${Date.now()}`;
    order.member = member;
    order.status = paid ? 'SUCCESS' : 'UNPAID';
    order.invoiceOptions = {};
    await manager.save(order);

    for (const [index, price] of productPrices.entries()) {
      const product = new Product();
      product.type = 'ProjectPlan';
      product.target = v4();
      product.id = `${product.type}_${product.target}`;
      await manager.save(product);

      const orderProduct = new OrderProduct();
      orderProduct.id = v4();
      orderProduct.order = order;
      orderProduct.product = product;
      orderProduct.name = `product ${index}`;
      orderProduct.price = price;
      orderProduct.currency = currency;
      await manager.save(orderProduct);
    }

    if (paid) {
      const payment = new PaymentLog();
      payment.no = `${order.id}0`;
      payment.order = order;
      payment.status = 'SUCCESS';
      payment.price = paid;
      payment.gateway = 'spgateway';
      payment.invoiceOptions = {};
      await manager.save(payment);
    }

    for (const each of invoices) {
      const invoice = new Invoice();
      invoice.orderId = order.id;
      invoice.no = each.no;
      invoice.price = each.price;
      invoice.revokedAt = each.revokedAt ?? null;
      invoice.options = {};
      await manager.save(invoice);
    }

    return order;
  };

  const issue = (manager: EntityManager, orderId: string, totalAmt: number, limitToOrderAmount = true) =>
    invoiceService.issueInvoiceDirectly(app.id, orderId, invoiceGatewayId, invoiceInfo(totalAmt), manager, {
      limitToOrderAmount,
    });

  const unrevokedInvoiceNumbers = async (manager: EntityManager, orderId: string) =>
    (await manager.getRepository(Invoice).findBy({ orderId }))
      .filter(({ revokedAt }) => !revokedAt)
      .map(({ no }) => no)
      .sort();

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
      .overrideProvider(EzpayClient)
      .useValue(ezpayClient)
      .compile();

    application = moduleFixture.createNestApplication();
    manager = application.get<EntityManager>(getEntityManagerToken());
    invoiceService = application.get(InvoiceService);
    currencyRepo = manager.getRepository(Currency);
    roleRepo = manager.getRepository(Role);
    appPlanRepo = manager.getRepository(AppPlan);
    appRepo = manager.getRepository(App);

    await currencyRepo.save(currency);
    await roleRepo.save(role);
    await appPlanRepo.save(appPlan);
    await appRepo.save(app);
    invoiceModule = await manager.getRepository(Module).findOneBy({ id: 'invoice' });

    await application.init();
  });

  afterAll(async () => {
    await appRepo.delete({ id: app.id });
    await appPlanRepo.delete({ id: appPlan.id });
    await application.close();
  });

  afterEach(() => jest.resetAllMocks());

  it('refuses a manual invoice once the unrevoked invoices already cover the order', async () => {
    await autoRollbackTransaction(manager, async manager => {
      const order = await givenOrder(manager, {
        productPrices: [2130, 71000],
        paid: 73130,
        invoices: [
          { no: 'AA00000001', price: 2130 },
          { no: 'AA00000002', price: 71000 },
        ],
      });

      await expect(issue(manager, order.id, 2130)).rejects.toBeInstanceOf(InvoiceExceedsOrderAmountError);
      expect(ezpayClient.issue).not.toHaveBeenCalled();
      expect(await unrevokedInvoiceNumbers(manager, order.id)).toEqual(['AA00000001', 'AA00000002']);
    });
  });

  it('allows re-issuing after the earlier invoice was revoked', async () => {
    await autoRollbackTransaction(manager, async manager => {
      const order = await givenOrder(manager, {
        productPrices: [25000],
        paid: 25000,
        invoices: [{ no: 'AA00000003', price: 25000, revokedAt: new Date() }],
      });
      mockIssued('AA00000004', 25000);

      const result = await issue(manager, order.id, 25000);

      expect(result.Status).toEqual('SUCCESS');
      expect(ezpayClient.issue).toHaveBeenCalledTimes(1);
      expect(await unrevokedInvoiceNumbers(manager, order.id)).toEqual(['AA00000004']);
    });
  });

  it('issues each invoice of a multi-invoice order up to the order amount, and no further', async () => {
    await autoRollbackTransaction(manager, async manager => {
      const order = await givenOrder(manager, { productPrices: [2130, 71000], paid: 73130 });
      mockIssued('AA00000005', 2130);
      mockIssued('AA00000006', 71000);

      await issue(manager, order.id, 2130);
      await issue(manager, order.id, 71000);
      await expect(issue(manager, order.id, 1)).rejects.toBeInstanceOf(InvoiceExceedsOrderAmountError);

      expect(ezpayClient.issue).toHaveBeenCalledTimes(2);
      expect(await unrevokedInvoiceNumbers(manager, order.id)).toEqual(['AA00000005', 'AA00000006']);
    });
  });

  it('measures against the paid amount when it is above the product total', async () => {
    await autoRollbackTransaction(manager, async manager => {
      const order = await givenOrder(manager, { productPrices: [80000], paid: 152000 });
      mockIssued('AA00000007', 152000);

      const result = await issue(manager, order.id, 152000);

      expect(result.Status).toEqual('SUCCESS');
    });
  });

  it('measures an unpaid order against its product total', async () => {
    await autoRollbackTransaction(manager, async manager => {
      const order = await givenOrder(manager, { productPrices: [11900], paid: 0 });

      await expect(issue(manager, order.id, 12000)).rejects.toBeInstanceOf(InvoiceExceedsOrderAmountError);
      expect(ezpayClient.issue).not.toHaveBeenCalled();
    });
  });

  it('leaves calls without limitToOrderAmount (the invoice runner) unchanged', async () => {
    await autoRollbackTransaction(manager, async manager => {
      const order = await givenOrder(manager, {
        productPrices: [10800],
        paid: 10800,
        invoices: [{ no: 'AA00000008', price: 10800 }],
      });
      mockIssued('AA00000009', 10800);

      const result = await issue(manager, order.id, 10800, false);

      expect(result.Status).toEqual('SUCCESS');
      expect(ezpayClient.issue).toHaveBeenCalledTimes(1);
    });
  });
});
