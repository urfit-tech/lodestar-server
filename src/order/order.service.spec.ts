import { v4 } from 'uuid';
import { EntityManager } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { getEntityManagerToken } from '@nestjs/typeorm';

import {
  OrderLogCsvHeaderMapping,
  OrderDiscountCsvHeaderMapping,
  OrderProductCsvHeaderMapping,
} from './class/csvHeaderMapping';
import { OrderService } from './order.service';
import { OrderInfrastructure } from './order.infra';
import { CouponInfrastructure } from '~/coupon/coupon.infra';
import { VoucherInfrastructure } from '~/voucher/voucher.infra';
import { SharingCodeInfrastructure } from '~/sharingCode/sharingCode.infra';
import { ProductInfrastructure } from '~/product/product.infra';
import { OrderLog } from './entity/order_log.entity';
import { OrderProduct } from './entity/order_product.entity';
import { PaymentLog } from '~/payment/payment_log.entity';
import { OrderDiscount } from './entity/order_discount.entity';
import { OrderExecutor } from './entity/order_executor.entity';
import { Member } from '~/member/entity/member.entity';
import { Invoice } from '~/invoice/invoice.entity';
import { Product } from '~/entity/Product';

describe('OrderService', () => {
  let service: OrderService;

  const mockOrderInfra = {
    getCategories: jest.fn(),
    getProperties: jest.fn(),
    getTags: jest.fn(),
  };
  const mockMemberInfra = {
    getMembersByConditions: jest.fn(),
  };
  const mockMemberRepo = {
    findOne: jest.fn(),
  };
  const mockCouponInfra = {
    getCouponsByConditions: jest.fn(),
  };
  const mockVoucherInfra = {
    getVoucherByConditions: jest.fn(),
  };

  const mockSharingCodeInfra = {
    getSharingCodeByConditions: jest.fn(),
  };

  const mockProductInfra = {
    getProductOwnerByProducts: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [],
      providers: [
        OrderService,
        {
          provide: OrderInfrastructure,
          useValue: mockOrderInfra,
        },
        {
          provide: CouponInfrastructure,
          useValue: mockCouponInfra,
        },
        {
          provide: VoucherInfrastructure,
          useValue: mockVoucherInfra,
        },
        {
          provide: SharingCodeInfrastructure,
          useValue: mockSharingCodeInfra,
        },
        {
          provide: ProductInfrastructure,
          useValue: mockProductInfra,
        },
        {
          provide: getEntityManagerToken(),
          useValue: { getRepository: jest.fn().mockImplementation(() => mockMemberRepo) },
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  afterEach(() => jest.resetAllMocks());

  describe('#OrderLogToRawCsv', () => {
    describe('Complementary of  export functionalities', () => {
      it('export all full header ', async () => {
        const orderLog = new OrderLog();
        const orderProduct = new OrderProduct();
        const paymentLog = new PaymentLog();
        const member = new Member();
        member.name = 'testMember';
        member.username = 'username';
        member.email = 'test@mail.com';
        orderProduct.name = 'product';
        orderProduct.price = 100;
        orderLog.id = 'testOrderId';
        orderLog.status = 'SUCCESS';
        orderLog.createdAt = new Date();
        orderLog.orderProducts = [orderProduct];
        orderLog.orderDiscounts = [];
        orderLog.orderExecutors = [];
        orderLog.paymentLogs = [paymentLog];
        orderLog.member = member;
        mockMemberInfra.getMembersByConditions.mockReturnValueOnce([]);
        const headerInfos = await new OrderLogCsvHeaderMapping().createHeader();
        const exportedRawRows = await service.orderLogToRawCsv(headerInfos, [orderLog], [], [], []);
        expect(exportedRawRows.length).toBe(1);
      });
    });
  });

  describe('#OrderProductToRawCsv', () => {
    describe('Complementary of  export functionalities', () => {
      it('export all full header ', async () => {
        const orderProduct = new OrderProduct();
        const orderLog = new OrderLog();
        const product = new Product();
        orderProduct.order = orderLog;
        orderProduct.product = product;
        mockMemberInfra.getMembersByConditions.mockReturnValueOnce([]);
        const headerInfos = await new OrderProductCsvHeaderMapping().createHeader();
        const exportedRawRows = await service.orderProductToRawCsv(headerInfos, [orderProduct], []);
        expect(exportedRawRows.length).toBe(1);
      });
    });
  });

  describe('#OrderDiscountToRawCsv', () => {
    describe('Complementary of  export functionalities', () => {
      it('export all full header ', async () => {
        const orderDiscount = new OrderDiscount();
        const orderLog = new OrderLog();
        orderDiscount.order = orderLog;
        mockMemberInfra.getMembersByConditions.mockReturnValueOnce([]);
        const headerInfos = await new OrderDiscountCsvHeaderMapping().createHeader();
        const exportedRawRows = await service.orderDiscountToRawCsv(headerInfos, [orderDiscount]);
        expect(exportedRawRows.length).toBe(1);
      });
    });
  });
});
