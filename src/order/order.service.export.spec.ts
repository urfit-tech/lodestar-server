import { Test, TestingModule } from '@nestjs/testing';
import { getEntityManagerToken } from '@nestjs/typeorm';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Asia/Taipei');

import {
  OrderLogCsvHeaderMapping,
  OrderProductCsvHeaderMapping,
} from './class/csvHeaderMapping';
import { OrderService } from './order.service';
import { OrderInfrastructure } from './order.infra';
import { CouponInfrastructure } from '~/coupon/coupon.infra';
import { VoucherInfrastructure } from '~/voucher/voucher.infra';
import { SharingCodeInfrastructure } from '~/sharingCode/sharingCode.infra';
import { ProductInfrastructure } from '~/product/product.infra';
import { PaymentInfrastructure } from '~/payment/payment.infra';
import { OrderLog } from './entity/order_log.entity';
import { OrderProduct } from './entity/order_product.entity';
import { OrderDiscount } from './entity/order_discount.entity';
import { OrderExecutor } from './entity/order_executor.entity';
import { PaymentLog } from '~/payment/payment_log.entity';
import { Member } from '~/member/entity/member.entity';
import { Product } from '~/entity/Product';
import { Coupon } from '~/coupon/entity/coupon.entity';
import { CouponCode } from '~/entity/CouponCode';
import { SharingCode } from '~/sharingCode/entity/sharing_code.entity.';
import { ProductOwner } from '~/product/product.type';
import { PaymentMethod } from '~/payment/payment_method.entity';

describe('OrderService export (regression snapshot)', () => {
  let service: OrderService;

  const mockOrderInfra = {};
  const mockCouponInfra = { getCouponsByConditions: jest.fn() };
  const mockVoucherInfra = { getVoucherByConditions: jest.fn() };
  const mockSharingCodeInfra = { getSharingCodeByConditions: jest.fn() };
  const mockProductInfra = { getProductOwnerByProducts: jest.fn() };
  const mockPaymentInfra = { getAllPaymentMethods: jest.fn() };
  const mockMemberRepo = { findOne: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [],
      providers: [
        OrderService,
        { provide: OrderInfrastructure, useValue: mockOrderInfra },
        { provide: CouponInfrastructure, useValue: mockCouponInfra },
        { provide: VoucherInfrastructure, useValue: mockVoucherInfra },
        { provide: SharingCodeInfrastructure, useValue: mockSharingCodeInfra },
        { provide: ProductInfrastructure, useValue: mockProductInfra },
        { provide: PaymentInfrastructure, useValue: mockPaymentInfra },
        {
          provide: getEntityManagerToken(),
          useValue: { getRepository: jest.fn().mockImplementation(() => mockMemberRepo) },
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  afterEach(() => jest.resetAllMocks());

  // ---- shared fixtures -------------------------------------------------

  const buildMember = (name: string, username: string, email: string): Member => {
    const member = new Member();
    member.name = name;
    member.username = username;
    member.email = email;
    return member;
  };

  const buildProduct = (target: string, type: string): Product => {
    const product = new Product();
    product.target = target;
    product.type = type;
    return product;
  };

  const buildOrderProduct = (opts: {
    name: string;
    price: number;
    productTarget: string;
    productType: string;
    options?: any;
  }): OrderProduct => {
    const orderProduct = new OrderProduct();
    orderProduct.name = opts.name;
    orderProduct.price = opts.price as any;
    orderProduct.options = opts.options ?? {};
    orderProduct.product = buildProduct(opts.productTarget, opts.productType);
    return orderProduct;
  };

  const buildOrderDiscount = (name: string, price: number, target: string): OrderDiscount => {
    const orderDiscount = new OrderDiscount();
    orderDiscount.name = name;
    orderDiscount.price = price as any;
    orderDiscount.target = target;
    return orderDiscount;
  };

  const buildOrderExecutor = (name: string, ratio: number): OrderExecutor => {
    const orderExecutor = new OrderExecutor();
    orderExecutor.ratio = ratio as any;
    orderExecutor.member = buildMember(name, name, `${name}@mail.com`);
    return orderExecutor;
  };

  const buildPaymentLog = (opts: { no: string; method?: string | null; paidAt?: Date | null; invoiceIssuedAt?: Date | null }): PaymentLog => {
    const paymentLog = new PaymentLog();
    paymentLog.no = opts.no;
    paymentLog.method = opts.method ?? null;
    paymentLog.paidAt = opts.paidAt ?? null;
    paymentLog.invoiceIssuedAt = opts.invoiceIssuedAt ?? null;
    return paymentLog;
  };

  const buildCoupon = (id: string, code: string): Coupon => {
    const coupon = new Coupon();
    coupon.id = id;
    const couponCode = new CouponCode();
    couponCode.code = code;
    coupon.couponCode = couponCode;
    return coupon;
  };

  const buildSharingCode = (path: string, note: string): SharingCode => {
    const sharingCode = new SharingCode();
    sharingCode.path = path;
    sharingCode.note = note;
    return sharingCode;
  };

  const buildProductOwner = (productId: string, memberName: string): ProductOwner => ({
    productId,
    memberName,
  });

  const buildPaymentMethod = (name: string, displayName: string): PaymentMethod => {
    const paymentMethod = new PaymentMethod();
    paymentMethod.name = name;
    paymentMethod.displayName = displayName;
    return paymentMethod;
  };

  // orderProducts: one whose product.target matches a productOwner + sharingCode,
  // one that matches neither (miss case) to exercise Map-vs-find equivalence.
  const orderLog1 = (() => {
    const orderLog = new OrderLog();
    orderLog.id = 'order-log-1';
    orderLog.status = 'SUCCESS';
    orderLog.createdAt = new Date('2024-01-01T03:00:00.000Z');
    orderLog.options = { country: 'Taiwan', countryCode: 'TW' };
    orderLog.shipping = {
      fee: 60,
      name: 'Receiver One',
      phone: '0912345678',
      address: 'Address One',
      zipCode: '100',
      city: 'Taipei',
      district: 'Zhongzheng',
    };
    orderLog.invoiceOptions = {
      referrerEmail: 'referrer1@mail.com',
      name: 'Invoice One',
      email: 'invoice1@mail.com',
      phone: '0987654321',
      uniformNumber: '12345678',
      uniformTitle: 'Company One',
      address: 'Invoice Address One',
      status: 'ISSUED',
    };
    orderLog.paymentModel = { gateway: 'spgateway' };
    orderLog.member = buildMember('Member One', 'member1', 'member1@mail.com');
    orderLog.paymentLogs = [
      buildPaymentLog({
        no: 'PAY-1-HIT',
        method: 'credit',
        paidAt: new Date('2024-01-01T04:00:00.000Z'),
        invoiceIssuedAt: new Date('2024-01-01T05:00:00.000Z'),
      }),
      buildPaymentLog({ no: 'PAY-1-MISS', method: 'unknown_method', paidAt: null, invoiceIssuedAt: null }),
    ];
    orderLog.orderProducts = [
      // hits owner + sharingCode
      buildOrderProduct({
        name: 'Product Hit',
        price: 1000,
        productTarget: 'product-owned-1',
        productType: 'ProgramPlan',
        options: { quantity: 1, sharingCode: 'SC1', from: '/sharing/path-1' },
      }),
      // misses owner + sharingCode
      buildOrderProduct({
        name: 'Product Miss',
        price: 500,
        productTarget: 'product-unowned',
        productType: 'ActivityTicket',
        options: { quantity: 2, sharingCode: 'SC2', from: '/sharing/path-unmatched', type: 'gift' },
      }),
    ];
    orderLog.orderDiscounts = [
      // hits coupon
      buildOrderDiscount('Coupon Discount', 100, 'coupon-1'),
      // misses coupon
      buildOrderDiscount('Unmatched Discount', 50, 'coupon-unmatched'),
    ];
    orderLog.orderExecutors = [buildOrderExecutor('Executor One', 1)];
    return orderLog;
  })();

  const orderLog2 = (() => {
    const orderLog = new OrderLog();
    orderLog.id = 'order-log-2';
    orderLog.status = 'PARTIAL_REFUND';
    orderLog.createdAt = new Date('2024-02-02T03:00:00.000Z');
    orderLog.options = { country: 'Japan', countryCode: 'JP' };
    orderLog.shipping = { isOutsideTaiwanIsland: 'true' };
    orderLog.invoiceOptions = {
      donationCode: 'DONATE-1',
      phoneBarCode: '/AB12345',
      postCode: '2000',
    };
    orderLog.paymentModel = { gateway: 'ecpay' };
    orderLog.member = buildMember('Member Two', 'member2', 'member2@mail.com');
    orderLog.paymentLogs = [buildPaymentLog({ no: 'PAY-2-EMPTY', method: null, paidAt: null, invoiceIssuedAt: null })];
    orderLog.orderProducts = [
      buildOrderProduct({
        name: 'Product Two',
        price: 300,
        productTarget: 'product-unowned',
        productType: 'PodcastPlan',
        options: { quantity: 1 },
      }),
    ];
    orderLog.orderDiscounts = [];
    orderLog.orderExecutors = [];
    return orderLog;
  })();

  const orderLogsFixture = [orderLog1, orderLog2];

  const couponsFixture = [buildCoupon('coupon-1', 'COUPONCODE1')];
  const sharingCodesFixture = [buildSharingCode('/sharing/path-1', 'sharing note 1')];
  const productOwnersFixture = [buildProductOwner('product-owned-1', 'Owner One')];
  const paymentMethodsFixture = [buildPaymentMethod('credit', '信用卡')];

  // ---- orderProducts fixture (for orderProductToRawCsv) ----------------

  const buildOrderProductRow = (opts: {
    orderId: string;
    productTarget: string;
    productType: string;
    productId: string;
    name: string;
    price: number;
    endedAt: Date;
    orderOptions: any;
    orderCreatedAt: Date;
    lastPaidAt: Date | null;
    invoiceOptions: any;
    options?: any;
  }): OrderProduct => {
    const orderProduct = new OrderProduct();
    orderProduct.orderId = opts.orderId;
    orderProduct.productId = opts.productId;
    orderProduct.name = opts.name;
    orderProduct.price = opts.price as any;
    orderProduct.endedAt = opts.endedAt;
    orderProduct.options = opts.options ?? { quantity: 1 };
    orderProduct.product = buildProduct(opts.productTarget, opts.productType);
    const order = new OrderLog();
    order.options = opts.orderOptions;
    order.createdAt = opts.orderCreatedAt;
    order.lastPaidAt = opts.lastPaidAt;
    order.invoiceOptions = opts.invoiceOptions;
    orderProduct.order = order;
    return orderProduct;
  };

  const orderProductsFixture = [
    buildOrderProductRow({
      orderId: 'order-log-1',
      productTarget: 'product-owned-1',
      productType: 'ProgramPlan',
      productId: 'product-id-hit',
      name: 'Product Hit',
      price: 1000,
      endedAt: new Date('2024-06-01T00:00:00.000Z'),
      orderOptions: { country: 'Taiwan', countryCode: 'TW', sharingCode: 'SC1' },
      orderCreatedAt: new Date('2024-01-01T03:00:00.000Z'),
      lastPaidAt: new Date('2024-01-01T04:00:00.000Z'),
      invoiceOptions: { referrer: 'referrer1@mail.com' },
    }),
    buildOrderProductRow({
      orderId: 'order-log-2',
      productTarget: 'product-unowned',
      productType: 'PodcastPlan',
      productId: 'product-id-miss',
      name: 'Product Miss',
      price: 300,
      endedAt: new Date('2024-06-02T00:00:00.000Z'),
      orderOptions: { country: 'Japan', countryCode: 'JP' },
      orderCreatedAt: new Date('2024-02-02T03:00:00.000Z'),
      lastPaidAt: null,
      invoiceOptions: {},
    }),
  ];

  // ---- tests -------------------------------------------------------------

  it('orderLogToRawCsv output is stable (regression snapshot)', async () => {
    const headerInfos = await new OrderLogCsvHeaderMapping().createHeader();
    const rows = await service.orderLogToRawCsv(
      headerInfos,
      orderLogsFixture,
      couponsFixture,
      sharingCodesFixture,
      productOwnersFixture,
      paymentMethodsFixture,
    );
    expect(rows).toMatchSnapshot();
  });

  it('orderProductToRawCsv output is stable (regression snapshot)', async () => {
    const headerInfos = await new OrderProductCsvHeaderMapping().createHeader();
    const rows = await service.orderProductToRawCsv(headerInfos, orderProductsFixture, productOwnersFixture);
    expect(rows).toMatchSnapshot();
  });

  it('orderLogToRawCsv uses the FIRST productOwner when multiple share a productId (first-match, not last-write)', async () => {
    // DB allows multiple product_owner rows per productId (co-instructors); ProgramRole unique key is
    // (memberId, name, programId). The original .find() returned the FIRST match; a plain
    // new Map(arr.map(...)) would be last-write-wins and silently change the exported owner.
    const orderLog = new OrderLog();
    orderLog.id = 'order-log-dup-owner';
    orderLog.status = 'SUCCESS';
    orderLog.createdAt = new Date('2024-04-04T03:00:00.000Z');
    orderLog.options = {};
    orderLog.shipping = {};
    orderLog.invoiceOptions = {};
    orderLog.paymentModel = {};
    orderLog.member = buildMember('Member Dup', 'member_dup', 'dup@mail.com');
    orderLog.paymentLogs = [];
    orderLog.orderProducts = [
      buildOrderProduct({
        name: 'Co-taught Product',
        price: 200,
        productTarget: 'product-shared',
        productType: 'ProgramPlan',
        options: { quantity: 1 },
      }),
    ];
    orderLog.orderDiscounts = [];
    orderLog.orderExecutors = [];

    const duplicateOwners: ProductOwner[] = [
      buildProductOwner('product-shared', 'First Owner'),
      buildProductOwner('product-shared', 'Second Owner'),
    ];

    const headerInfos = await new OrderLogCsvHeaderMapping().createHeader();
    const rows = await service.orderLogToRawCsv(
      headerInfos,
      [orderLog],
      couponsFixture,
      sharingCodesFixture,
      duplicateOwners,
      paymentMethodsFixture,
    );
    // First owner wins, matching original Array.find behavior.
    expect(rows[0][headerInfos.orderProductName]).toBe('Co-taught Product * 1 - First Owner $200');
  });

  it('orderProductToRawCsv uses the FIRST productOwner when multiple share a productId', async () => {
    const orderProduct = buildOrderProductRow({
      orderId: 'order-log-dup-owner',
      productTarget: 'product-shared',
      productType: 'ProgramPlan',
      productId: 'product-id-shared',
      name: 'Co-taught Product',
      price: 200,
      endedAt: new Date('2024-06-04T00:00:00.000Z'),
      orderOptions: {},
      orderCreatedAt: new Date('2024-04-04T03:00:00.000Z'),
      lastPaidAt: null,
      invoiceOptions: {},
    });
    const duplicateOwners: ProductOwner[] = [
      buildProductOwner('product-shared', 'First Owner'),
      buildProductOwner('product-shared', 'Second Owner'),
    ];

    const headerInfos = await new OrderProductCsvHeaderMapping().createHeader();
    const rows = await service.orderProductToRawCsv(headerInfos, [orderProduct], duplicateOwners);
    expect(rows[0][headerInfos.productOwner]).toBe('First Owner');
  });

  it('orderLogToRawCsv does not throw when orderProduct.product is undefined and productOwners is non-empty', async () => {
    // Original .find() was lazy: with a non-empty productOwners array the predicate runs and
    // reads orderProduct.product.target, so an undefined product would have thrown too — but the
    // Map refactor made the access eager for EVERY row. This guards the restored optional-chaining
    // access (product?.target) so a missing product yields '' for the owner column, no crash.
    const orderLog = new OrderLog();
    orderLog.id = 'order-log-no-product';
    orderLog.status = 'SUCCESS';
    orderLog.createdAt = new Date('2024-03-03T03:00:00.000Z');
    orderLog.options = {};
    orderLog.shipping = {};
    orderLog.invoiceOptions = {};
    orderLog.paymentModel = {};
    orderLog.member = buildMember('Member NoProduct', 'member_np', 'np@mail.com');
    orderLog.paymentLogs = [];
    const orderProductWithoutProduct = new OrderProduct();
    orderProductWithoutProduct.name = 'Ghost Product';
    orderProductWithoutProduct.price = 100 as any;
    orderProductWithoutProduct.options = { quantity: 1 };
    orderProductWithoutProduct.product = undefined as any;
    orderLog.orderProducts = [orderProductWithoutProduct];
    orderLog.orderDiscounts = [];
    orderLog.orderExecutors = [];

    const headerInfos = await new OrderLogCsvHeaderMapping().createHeader();

    let rows: Array<Record<string, any>> | undefined;
    await expect(
      (async () => {
        rows = await service.orderLogToRawCsv(
          headerInfos,
          [orderLog],
          couponsFixture,
          sharingCodesFixture,
          productOwnersFixture, // non-empty on purpose
          paymentMethodsFixture,
        );
      })(),
    ).resolves.not.toThrow();

    expect(rows).toHaveLength(1);
    // owner column ("項目名稱") renders an empty owner segment: "Ghost Product * 1 -  $100"
    expect(rows![0][headerInfos.orderProductName]).toBe('Ghost Product * 1 -  $100');
  });
});
