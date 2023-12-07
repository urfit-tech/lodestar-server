import { Injectable } from '@nestjs/common';
import { Between, EntityManager, Equal, FindOptionsOrder, FindOptionsSelect, FindOptionsWhere, In } from 'typeorm';
import { OrderLog } from './entity/order_log.entity';
import { InjectEntityManager } from '@nestjs/typeorm';
import { OrderExportDTO, TransferReceivedOrderDTO } from './order.dto';
import { APIException } from '~/api.excetion';
import { OrderInfrastructure } from './order.infra';
import { CouponInfrastructure } from '~/coupon/coupon.infra';
import {
  OrderDiscountCsvHeaderMapping,
  OrderLogCsvHeaderMapping,
  OrderProductCsvHeaderMapping,
} from './class/csvHeaderMapping';
import { CsvRawOrderLog } from './class/csvRawOrderLog';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import { defaultTo, flatten, get, isEmpty } from 'lodash';
import { OrderProduct } from './entity/order_product.entity';
import { OrderDiscount } from './entity/order_discount.entity';
import { SharingCodeInfrastructure } from '~/sharingCode/sharingCode.infra';
import { Coupon } from '~/coupon/entity/coupon.entity';
import { SharingCode } from '~/sharingCode/entity/sharing_code.entity.';
import { CsvRawOrderProduct } from './class/csvRawOrderProduct';
import { CsvRawOrderDiscount } from './class/csvRawOrderDiscount';
import { ProductInfrastructure } from '~/product/product.infra';
import { ProductOwner } from '~/product/product.type';
import { VoucherInfrastructure } from '~/voucher/voucher.infra';

dayjs.extend(timezone);
@Injectable()
export class OrderService {
  constructor(
    private readonly orderInfra: OrderInfrastructure,
    private readonly couponInfra: CouponInfrastructure,
    private readonly voucherInfra: VoucherInfrastructure,
    private readonly sharingCodeInfra: SharingCodeInfrastructure,
    private readonly productInfra: ProductInfrastructure,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}
  async transferReceivedOrder(dto: TransferReceivedOrderDTO) {
    const OrderLogRepo = this.entityManager.getRepository(OrderLog);
    const { orderId, memberId } = dto;
    if (!memberId) {
      throw new APIException({ code: 'E_NULL_MEMBER', message: 'memberId is null or undefined' });
    }
    if (!orderId) {
      throw new APIException({ code: 'E_NULL_ORDER', message: 'orderId is null or undefined' });
    }
    try {
      const updateResult = await OrderLogRepo.update(orderId, {
        memberId: memberId,
        transferredAt: new Date(),
      });
      return updateResult;
    } catch {
      throw new APIException({ code: 'E_DB_UPDATE', message: 'data update failed' });
    }
  }
  async getOrderById(orderId: string) {
    const OrderLogRepo = this.entityManager.getRepository(OrderLog);
    let orderLog;
    try {
      orderLog = await OrderLogRepo.findOneBy({ id: orderId });
    } catch {
      throw new APIException({ code: 'E_DB_GET_ORDER_ERROR', message: 'get order error.' });
    }

    if (!orderLog) {
      throw new APIException({ code: 'E_DB_GET_ORDER_NOT_FOUND', message: 'order not found.' });
    }
    return orderLog;
  }

  async exportOrderLogsFromDatabase(
    appId: string,
    conditions: OrderExportDTO,
    discountTargets?: Array<string>,
  ): Promise<OrderLog[]> {
    const wrapCondition: FindOptionsWhere<OrderLog> = conditions
      ? {
          ...(conditions.statuses && { status: In(conditions.statuses) }),
          ...(conditions.createdAt && {
            createdAt: Between(new Date(conditions.createdAt.startedAt), new Date(conditions.createdAt.endedAt)),
          }),
          ...(conditions.lastPaidAt && {
            lastPaidAt: Between(new Date(conditions.lastPaidAt.startedAt), new Date(conditions.lastPaidAt.endedAt)),
          }),
          ...(conditions.productIds && {
            orderProducts: {
              productId: In(conditions.productIds),
            },
          }),
          ...(discountTargets && {
            orderDiscounts: {
              target: In(discountTargets),
            },
          }),
        }
      : {};
    const warpSelect: FindOptionsSelect<OrderLog> = {
      id: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      appId: true,
      shipping: true,
      paymentModel: {},
      options: {},
      invoiceOptions: {}, // ref: https://github.com/typeorm/typeorm/issues/9852
      memberId: true,
      member: {
        email: true,
        username: true,
        name: true,
      },
      paymentLogs: {
        no: true,
        createdAt: true,
        paidAt: true,
        options: true,
        invoiceIssuedAt: true,
      },
      orderProducts: {
        name: true,
        options: true,
        price: true,
        createdAt: true,
        product: {
          target: true,
          type: true,
        },
      },
      orderDiscounts: {
        name: true,
        price: true,
        target: true,
      },
      orderExecutors: {
        ratio: true,
        member: {
          name: true,
        },
      },
    };

    const wrapOrder: FindOptionsOrder<OrderLog> = {
      createdAt: 'ASC',
      paymentLogs: {
        createdAt: 'DESC',
      },
    };

    const orderLogs = await this.orderInfra.exportOrderLogsByAppId(
      appId,
      this.entityManager,
      wrapCondition,
      warpSelect,
      wrapOrder,
    );

    return orderLogs;
  }

  async exportOrderProductsFromDatabase(
    appId: string,
    conditions: OrderExportDTO,
    discountTargets?: Array<string>,
  ): Promise<OrderProduct[]> {
    const wrapCondition: FindOptionsWhere<OrderProduct> = conditions
      ? {
          order: {
            ...(conditions.statuses && { status: In(conditions.statuses) }),
            ...(conditions.createdAt && {
              createdAt: Between(new Date(conditions.createdAt.startedAt), new Date(conditions.createdAt.endedAt)),
            }),
            ...(conditions.lastPaidAt && {
              lastPaidAt: Between(new Date(conditions.lastPaidAt.startedAt), new Date(conditions.lastPaidAt.endedAt)),
            }),
            ...(discountTargets && {
              orderDiscounts: {
                target: In(discountTargets),
              },
            }),
          },
          ...(conditions.productIds && {
            productId: In(conditions.productIds),
          }),
        }
      : {};
    const warpSelect: FindOptionsSelect<OrderProduct> = {
      productId: true,
      price: true,
      name: true,
      orderId: true,
      endedAt: true,
      options: true,
      order: {
        options: {},
        invoiceOptions: {},
        createdAt: true,
        lastPaidAt: true,
      },
      product: {
        type: true,
        target: true,
      },
    };

    const wrapOrder: FindOptionsOrder<OrderProduct> = {
      order: { createdAt: 'ASC' },
    };

    const orderProducts = await this.orderInfra.exportOrderProductsByAppId(
      appId,
      this.entityManager,
      wrapCondition,
      warpSelect,
      wrapOrder,
    );

    return orderProducts;
  }

  async exportOrderDiscountsFromDatabase(
    appId: string,
    conditions: OrderExportDTO,
    discountTargets?: Array<string>,
  ): Promise<OrderDiscount[]> {
    const wrapCondition: FindOptionsWhere<OrderDiscount> = conditions
      ? {
          order: {
            ...(conditions.statuses && { status: In(conditions.statuses) }),
            ...(conditions.createdAt && {
              createdAt: Between(new Date(conditions.createdAt.startedAt), new Date(conditions.createdAt.endedAt)),
            }),
            ...(conditions.lastPaidAt && {
              lastPaidAt: Between(new Date(conditions.lastPaidAt.startedAt), new Date(conditions.lastPaidAt.endedAt)),
            }),
            ...(conditions.productIds && {
              orderProducts: { productId: In(conditions.productIds) },
            }),
          },
          ...(discountTargets && {
            target: In(discountTargets),
          }),
        }
      : {};
    const warpSelect: FindOptionsSelect<OrderDiscount> = {
      id: true,
      price: true,
      name: true,
      order: {
        id: true,
        options: {},
      },
    };

    const wrapOrder: FindOptionsOrder<OrderDiscount> = {
      order: { createdAt: 'ASC' },
    };

    const orderDiscounts = await this.orderInfra.exportOrderDiscountsByAppId(
      appId,
      this.entityManager,
      wrapCondition,
      warpSelect,
      wrapOrder,
    );

    return orderDiscounts;
  }

  async orderLogToRawCsv(
    headerInfos: OrderLogCsvHeaderMapping,
    orderLogs: Array<OrderLog>,
    coupons: Array<Coupon>,
    sharingCodes: Array<SharingCode>,
    productOwners: Array<ProductOwner>,
  ): Promise<Array<Record<string, any>>> {
    const dateFormatter = (value: Date | string, format?: string) =>
      dayjs.tz(value).format(format || `YYYY/MM/DD HH:mm`);
    const getValue = (object: object, key: string) => {
      return defaultTo(get(object, key), '');
    };

    const orderProductAggregator = (orderProducts: Array<OrderProduct>) => {
      let orderProductCount = 0;
      let orderProductTotalPrice = 0;
      const name: Array<string> = [];
      const gift: Array<string> = [];
      const sharingCode: Array<string> = [];
      const sharingNote: Array<string> = [];

      for (const orderProduct of orderProducts) {
        const productOwner =
          productOwners.find((owner) => owner.productId === orderProduct.product.target)?.memberName || '';
        orderProductCount += (getValue(orderProduct.options, 'quantity') as number) || 0;
        orderProductTotalPrice += parseFloat(orderProduct.price as any);
        name.push(
          `${orderProduct.name} * ${getValue(orderProduct.options, 'quantity') || 1} - ${productOwner} $${parseFloat(
            orderProduct.price as any,
          )}`,
        );
        sharingCode.push(getValue(orderProduct.options, 'sharingCode'));
        sharingNote.push(
          sharingCodes.find((sharingCode) => sharingCode.path === getValue(orderProduct.options, 'from'))?.note,
        );
        if (getValue(orderProduct.options, 'type') === 'gift') {
          gift.push(orderProduct.name);
        }
      }
      return {
        orderProductCount,
        orderProductTotalPrice,
        gift: gift.join('\n'),
        orderProductName: name.join('\n'),
        sharingCode: sharingCode.join('\n'),
        sharingNote: sharingNote.join('\n'),
      };
    };

    const orderDiscountsAggregator = (orderDiscounts: Array<OrderDiscount>) => {
      let orderDiscountTotalPrice = 0;
      const name: Array<string> = [];

      for (const orderDiscount of orderDiscounts) {
        orderDiscountTotalPrice += parseFloat(orderDiscount.price as any);
        const coupon = coupons.find((coupon) => coupon.id === orderDiscount.target);
        if (coupon) {
          name.push(`${orderDiscount.name} $${orderDiscount.price} - ${coupon.couponCode.code}`);
        } else {
          name.push(`${orderDiscount.name} $${orderDiscount.price}`);
        }
      }

      return {
        orderDiscountTotalPrice,
        orderDiscountName: name.join('\n'),
      };
    };

    return orderLogs
      .map((each) => {
        const csvRawOrderLog = new CsvRawOrderLog();
        const { orderProductCount, orderProductName, orderProductTotalPrice, sharingCode, sharingNote, gift } =
          orderProductAggregator(each.orderProducts);
        const { orderDiscountName, orderDiscountTotalPrice } = orderDiscountsAggregator(each.orderDiscounts);

        csvRawOrderLog.orderLogId = each.id;
        csvRawOrderLog.paymentLogNo = each.paymentLogs.map((payment) => payment.no).join('\n');
        csvRawOrderLog.orderLogStatus = each.status;
        csvRawOrderLog.paymentLogGateway = getValue(each.paymentModel, 'gateway');
        csvRawOrderLog.paymentLogDetails = each.paymentLogs
          .map(
            (payment) =>
              `${getValue(payment.options, 'paymentMethod')} ${getValue(payment.options, 'installmentPlan')}`,
          )
          .join('\n');
        csvRawOrderLog.orderCountry = `${getValue(each.options, 'country')} ${getValue(each.options, 'countryCode')}`;
        csvRawOrderLog.orderLogCreatedAt = dateFormatter(each.createdAt);
        csvRawOrderLog.paymentLogPaidAt = each.paymentLogs
          .map((payment) => (payment.paidAt ? dateFormatter(payment.paidAt) : ''))
          .join('\n');
        csvRawOrderLog.memberName = `${each.member.name}(${each.member.username})`;
        csvRawOrderLog.memberEmail = each.member.email;
        csvRawOrderLog.orderProductName = orderProductName;
        csvRawOrderLog.orderDiscountName = orderDiscountName;
        csvRawOrderLog.orderProductCount = orderProductCount;
        csvRawOrderLog.orderProductTotalPrice = orderProductTotalPrice;
        csvRawOrderLog.shippingFee = getValue(each.shipping, 'fee');
        csvRawOrderLog.orderDiscountTotalPrice = orderDiscountTotalPrice;
        csvRawOrderLog.orderLogTotalPrice = Math.max(
          orderProductTotalPrice - orderDiscountTotalPrice + ((getValue(each.shipping, 'fee') as number) || 0),
          0,
        );
        csvRawOrderLog.sharingCode = sharingCode;
        csvRawOrderLog.sharingNote = sharingNote;
        csvRawOrderLog.referrer = getValue(each.invoiceOptions, 'referrerEmail');
        csvRawOrderLog.orderLogExecutor = each.orderExecutors
          .map((executor) => `${executor?.member?.name} ${executor?.ratio}`)
          .join('\n');
        csvRawOrderLog.gift = gift;
        csvRawOrderLog.send = getValue(each.shipping, 'isOutsideTaiwanIsland')
          ? getValue(each.shipping, 'isOutsideTaiwanIsland') === 'true'
            ? '否'
            : getValue(each.shipping, 'isOutsideTaiwanIsland') === 'false'
            ? '是'
            : ''
          : !!getValue(each.shipping, 'name') && getValue(each.shipping, 'phone') && getValue(each.shipping, 'address')
          ? '是'
          : '';
        csvRawOrderLog.recipientName =
          getValue(each.shipping, 'isOutsideTaiwanIsland') === 'true' ? '' : getValue(each.shipping, 'name');
        csvRawOrderLog.recipientPhone =
          getValue(each.shipping, 'isOutsideTaiwanIsland') === 'true' ? '' : getValue(each.shipping, 'phone');
        csvRawOrderLog.recipientAddress =
          getValue(each.shipping, 'isOutsideTaiwanIsland') === 'true'
            ? ''
            : `${getValue(each.shipping, 'zipCode')}${getValue(each.shipping, 'city')}${getValue(
                each.shipping,
                'district',
              )}${getValue(each.shipping, 'address')}`;
        csvRawOrderLog.invoiceName = getValue(each.invoiceOptions, 'name');
        csvRawOrderLog.invoiceEmail = getValue(each.invoiceOptions, 'email');
        csvRawOrderLog.invoicePhone =
          getValue(each.invoiceOptions, 'phone') || getValue(each.invoiceOptions, 'buyerPhone');
        csvRawOrderLog.invoiceTarget = getValue(each.invoiceOptions, 'donationCode')
          ? '捐贈'
          : getValue(each.invoiceOptions, 'uniformNumber')
          ? '公司'
          : '個人';
        csvRawOrderLog.invoiceCarrier = getValue(each.invoiceOptions, 'phoneBarCode')
          ? '手機'
          : getValue(each.invoiceOptions, 'citizenCode')
          ? '自然人憑證'
          : '';
        csvRawOrderLog.invoiceDonationCode = getValue(each.invoiceOptions, 'donationCode');
        csvRawOrderLog.invoiceUniformNumber = getValue(each.invoiceOptions, 'uniformNumber');
        csvRawOrderLog.invoiceUniformTitle = getValue(each.invoiceOptions, 'uniformTitle');
        csvRawOrderLog.invoiceAddress =
          getValue(each.invoiceOptions, 'address') || getValue(each.invoiceOptions, 'postCode');
        csvRawOrderLog.invoiceId = get(each.invoiceOptions, 'id') || get(each.invoiceOptions, 'invoiceNumber') || '';
        csvRawOrderLog.invoiceIssuedAt = each.paymentLogs
          .map((payment) => (payment.invoiceIssuedAt ? dateFormatter(payment.invoiceIssuedAt) : ''))
          .join('\n');
        csvRawOrderLog.invoiceStatus = getValue(each.invoiceOptions, 'status');

        return csvRawOrderLog;
      })
      .map((each) => each.serializeToCsvRawRow(headerInfos));
  }

  async orderProductToRawCsv(
    headerInfos: OrderProductCsvHeaderMapping,
    orderProducts: Array<OrderProduct>,
    productOwners: Array<ProductOwner>,
  ): Promise<Array<Record<string, any>>> {
    const dateFormatter = (value: Date | string, format?: string) =>
      dayjs.tz(value).format(format || `YYYY/MM/DD HH:mm`);
    const getValue = (object: object, key: string) => {
      return defaultTo(get(object, key), '');
    };
    return orderProducts
      .map((each) => {
        const csvRawOrderProduct = new CsvRawOrderProduct();
        csvRawOrderProduct.orderLogId = each.orderId;
        csvRawOrderProduct.orderCountry = `${getValue(each.order.options, 'country')} ${getValue(
          each.order.options,
          'countryCode',
        )}`;
        csvRawOrderProduct.orderLogCreatedAt = dateFormatter(each.order.createdAt);
        csvRawOrderProduct.paymentLogPaidAt = each.order.lastPaidAt ? dateFormatter(each.order.lastPaidAt) : '';
        csvRawOrderProduct.productOwner =
          productOwners.find((owner) => owner.productId === each.product.target)?.memberName || '';
        csvRawOrderProduct.productType = each.product.type;
        csvRawOrderProduct.orderProductId = each.productId;
        csvRawOrderProduct.orderProductName = each.name;
        csvRawOrderProduct.productEndedAt = dateFormatter(each.endedAt);
        csvRawOrderProduct.productQuantity = getValue(each.options, 'quantity') || 1;
        csvRawOrderProduct.productPrice = each.price;
        csvRawOrderProduct.sharingCode = getValue(each.order.options, 'sharingCode');
        csvRawOrderProduct.referrer = getValue(each.order.invoiceOptions, 'referrer');

        return csvRawOrderProduct;
      })
      .map((each) => each.serializeToCsvRawRow(headerInfos));
  }

  async orderDiscountToRawCsv(
    headerInfos: OrderDiscountCsvHeaderMapping,
    orderDiscounts: Array<OrderDiscount>,
  ): Promise<Array<Record<string, any>>> {
    const getValue = (object: object, key: string) => {
      return defaultTo(get(object, key), '');
    };

    return orderDiscounts
      .map((each) => {
        const csvRawOrderDiscount = new CsvRawOrderDiscount();
        csvRawOrderDiscount.orderLogId = each.order.id;
        csvRawOrderDiscount.orderCountry = `${getValue(each.order.options, 'country')} ${getValue(
          each.order.options,
          'countryCode',
        )}`;
        csvRawOrderDiscount.orderDiscountId = each.id;
        csvRawOrderDiscount.orderDiscountName = each.name;
        csvRawOrderDiscount.orderDiscountPrice = each.price;
        return csvRawOrderDiscount;
      })
      .map((each) => each.serializeToCsvRawRow(headerInfos));
  }

  public async processOrderLogExportFromDatabase(appId: string, condition: OrderExportDTO) {
    dayjs.tz.setDefault(condition.timezone);
    const discountTargets = await this.getOrderDiscountTargetsByPlanIds(appId, condition);
    const orderLogs = await this.exportOrderLogsFromDatabase(appId, condition, discountTargets);
    const coupons = await this.couponInfra.getCouponsByConditions(
      { id: In(flatten(orderLogs.map((orderLog) => orderLog.orderDiscounts.map((discount) => discount.target)))) },
      this.entityManager,
    );
    const sharingCodes = await this.sharingCodeInfra.getSharingCodeByConditions(
      {
        appId: Equal(appId),
      },
      this.entityManager,
    );
    const productOwners = await this.productInfra.getProductOwnerByProducts(
      appId,
      flatten(orderLogs.map((orderLog) => orderLog.orderProducts.map((orderProduct) => orderProduct.product))),
      this.entityManager,
    );

    const headerInfos = await new OrderLogCsvHeaderMapping().createHeader();
    return [
      await headerInfos.serializeToRawRow(),
      ...(await this.orderLogToRawCsv(headerInfos, orderLogs, coupons, sharingCodes, productOwners)),
    ];
  }

  public async processOrderProductExportFromDatabase(appId: string, condition: OrderExportDTO) {
    dayjs.tz.setDefault(condition.timezone);
    const discountTargets = await this.getOrderDiscountTargetsByPlanIds(appId, condition);
    const orderProducts = await this.exportOrderProductsFromDatabase(appId, condition, discountTargets);
    const productOwners = await this.productInfra.getProductOwnerByProducts(
      appId,
      flatten(orderProducts.map((orderProduct) => orderProduct.product)),
      this.entityManager,
    );
    const headerInfos = await new OrderProductCsvHeaderMapping().createHeader();
    return [
      await headerInfos.serializeToRawRow(),
      ...(await this.orderProductToRawCsv(headerInfos, orderProducts, productOwners)),
    ];
  }

  public async processOrderDiscountExportFromDatabase(appId: string, condition: OrderExportDTO) {
    dayjs.tz.setDefault(condition.timezone);
    const discountTargets = await this.getOrderDiscountTargetsByPlanIds(appId, condition);
    const orderDiscounts = await this.exportOrderDiscountsFromDatabase(appId, condition, discountTargets);
    const headerInfos = await new OrderDiscountCsvHeaderMapping().createHeader();
    return [await headerInfos.serializeToRawRow(), ...(await this.orderDiscountToRawCsv(headerInfos, orderDiscounts))];
  }

  private async getOrderDiscountTargetsByPlanIds(appId: string, condition: OrderExportDTO): Promise<string[] | null> {
    const targets = [];
    if (condition.couponPlanIds) {
      const coupons = await this.couponInfra.getCouponsByConditions(
        {
          couponCode: {
            appId,
            couponPlan: {
              id: In(condition.couponPlanIds),
            },
          },
        },
        this.entityManager,
      );
      coupons.forEach((coupon) => {
        targets.push(coupon.id);
      });
    }
    if (condition.voucherPlanIds) {
      const vouchers = await this.voucherInfra.getVouchersByConditions(
        {
          voucherCode: {
            voucherPlan: {
              id: In(condition.voucherPlanIds),
            },
          },
        },
        this.entityManager,
      );
      vouchers.forEach((voucher) => {
        targets.push(voucher.id);
      });
    }
    return isEmpty(targets) ? null : targets;
  }

  public async getOrderProductsByMemberId(memberId: string, productType?: string): Promise<OrderProduct[]> {
    const orderProducts = await this.entityManager.getRepository(OrderProduct).find({
      where: {
        order: {
          memberId: memberId,
        },
        ...(productType && { product: { type: productType } }),
      },
    });
    return orderProducts;
  }
}
