import { Coupon } from '~/coupon/entity/coupon.entity';
import { OrderProductStructType } from './product.model';
import { CoinStatus } from '~/entity/CoinStatus';
import { intersection, min } from 'lodash';
import { Voucher } from '~/voucher/entity/voucher.entity';
import { PointLog } from '~/entity/PointLog';

export enum OrderDiscountType {
  Coupon = 'Coupon',
  Voucher = 'Voucher',
  Card = 'Card',
  DownPrice = 'DownPrice',
  Point = 'Point',
  Coin = 'Coin',
}

type OrderDiscount = {
  name: string;
  description: string | null;
  price: number;
  type: OrderDiscountType;
  target: string;
  options?: { [key: string]: any };
};

export abstract class Discount {
  id: string;
  name: string;
  description: string;
  products: OrderProductStructType[];
  constructor(id: string, name: string, description: string, products: OrderProductStructType[]) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.products = products;
  }
  abstract checkout(
    memberId: string,
    productIds: string[],
    productOptions?: { [productId: string]: any },
  ): OrderDiscount[];

  protected getTotalPrice(): number {
    return this.products.reduce((accumulator, product) => {
      const price = typeof product.price === 'number' ? product.price : 0;
      return accumulator + price;
    }, 0);
  }
}

export class CouponDiscount extends Discount {
  coupon: Coupon;

  constructor({
    id,
    name,
    description,
    coupon,
    products,
  }: {
    id: string;
    name: string;
    description: string;
    coupon: Coupon;
    products: OrderProductStructType[];
  }) {
    super(id, name, description, products);
    this.coupon = coupon;
  }

  checkout(memberId: string, productIds: string[], productOptions?: { [productId: string]: any }): OrderDiscount[] {
    this.ensureCouponIsValid();
    this.ensureCouponIsApplicable(memberId);

    const totalPrice = this.getTotalPrice();
    this.ensureMinimumPriceRequirement(totalPrice);

    const discountPrice = this.calculateDiscount(totalPrice);

    return [
      {
        type: OrderDiscountType.Coupon,
        target: this.id,
        name: `【折價券】${this.name}`,
        description: this.description,
        price: Math.min(discountPrice, totalPrice),
      },
    ];
  }

  private ensureCouponIsValid() {
    if (this.coupon.couponCode.deletedAt) {
      throw new Error('此折價碼不存在');
    }

    if (!this.coupon) {
      throw new Error('此折價券不存在');
    }
  }

  private ensureCouponIsApplicable(memberId: string) {
    if (this.coupon.memberId !== memberId) {
      throw new Error('無法使用非本人的折價券');
    }

    const isAvailable = !this.coupon.couponStatus.used && !this.coupon.couponStatus.outdated;

    if (!isAvailable) {
      throw new Error('無法使用此折價券');
    }
  }

  private ensureMinimumPriceRequirement(totalPrice: number) {
    const constraint = this.coupon.couponCode.couponPlan.constraint;

    if (totalPrice < constraint) {
      throw new Error('消費金額未達標準');
    }
  }

  private calculateDiscount(totalPrice: number): number {
    switch (this.coupon.couponCode.couponPlan.type) {
      case 1:
        return this.coupon.couponCode.couponPlan.amount;
      case 2:
        return Math.floor((totalPrice * this.coupon.couponCode.couponPlan.amount) / 100);
      default:
        return 0;
    }
  }
}

export class CoinDiscount extends Discount {
  coins: CoinStatus[];
  coinExChangeRateAppSetting: number;

  constructor({
    id,
    name,
    description,
    coins,
    products,
    coinExChangeRateAppSetting,
  }: {
    id: string;
    name: string;
    description: string;
    coins: CoinStatus[];
    products: OrderProductStructType[];
    coinExChangeRateAppSetting: string;
  }) {
    super(id, name, description, products);
    this.coins = coins;
    this.coinExChangeRateAppSetting = parseInt(coinExChangeRateAppSetting, 10);
  }

  checkout(memberId: string, productIds: string[], productOptions?: { [productId: string]: any }): OrderDiscount[] {
    const exchangeRate = this.coinExChangeRateAppSetting;

    const calculateDiscounts = (totalPrice: number): OrderDiscount[] =>
      this.coins
        .map((coinStatus) => ({
          coinStatus,
          usedCoins: min([coinStatus.remaining, Math.floor(totalPrice / exchangeRate)]),
        }))
        .filter(({ usedCoins }) => usedCoins > 0)
        .map(({ coinStatus, usedCoins }) => {
          const discountPrice = usedCoins * exchangeRate;
          return {
            type: OrderDiscountType.Coin,
            target: coinStatus.coinId,
            name: `【代幣折抵】${coinStatus.coinLog?.title}`,
            description: coinStatus.coinLog.description || '',
            price: discountPrice,
            options: { coins: usedCoins, exchangeRate },
          };
        });

    const totalPrice = this.getTotalPrice();
    const orderDiscounts = calculateDiscounts(totalPrice);

    return [...orderDiscounts];
  }
}

export class VoucherDiscount extends Discount {
  voucher: Voucher;

  constructor({
    id,
    name,
    description,
    voucher,
    products,
  }: {
    id: string;
    name: string;
    description: string;
    voucher: Voucher;
    products: OrderProductStructType[];
  }) {
    super(id, name, description, products);
    this.voucher = voucher;
  }

  checkout(memberId: string, productIds: string[], productOptions?: { [productId: string]: any }): OrderDiscount[] {
    this.validateVoucherExists();

    this.ensureVoucherExists();

    this.verifyVoucherForMember(memberId);

    this.checkVoucherAvailability();

    this.checkProductQuantity();

    const orderDiscounts: OrderDiscount[] = [
      {
        type: OrderDiscountType.Voucher,
        target: this.id,
        name: `【兌換券】${this.voucher.voucherCode.voucherPlan.title}`,
        description: this.voucher.voucherCode.voucherPlan.description || '',
        price: this.getTotalPrice(),
      },
    ];
    return orderDiscounts;
  }

  private validateVoucherExists() {
    if (this.voucher?.voucherCode.deletedAt) {
      throw new Error('此兌換碼不存在');
    }
  }

  private ensureVoucherExists() {
    if (!this.voucher) {
      throw new Error('此兌換券不存在');
    }
  }

  private verifyVoucherForMember(memberId) {
    if (this.voucher.memberId !== memberId) {
      throw new Error('無法使用非本人的兌換券');
    }
  }

  private checkVoucherAvailability() {
    const available =
      this.voucher.voucherStatus && !this.voucher.voucherStatus.used && !this.voucher.voucherStatus.outdated;
    if (!available) {
      throw new Error('無法使用此兌換券');
    }
  }

  private checkProductQuantity() {
    const voucherPlan = this.voucher.voucherCode.voucherPlan;

    if (voucherPlan) {
      const { voucherPlanProducts = [], productQuantityLimit = 0 } = voucherPlan;
      const voucherPlanProductIds = voucherPlanProducts.map((vp) => vp.product.id);
      const checkoutProductIds = this.products.map((p) => p.productId);
      const interSectionProductIds = intersection(checkoutProductIds, voucherPlanProductIds);

      if (interSectionProductIds.length > productQuantityLimit) {
        throw new Error('兌換錯誤');
      }
    } else {
      console.error('Voucher plan is not defined.');
    }
  }
}

export class PointDiscount extends Discount {
  points: PointLog[];
  pointExchangeRateSetting: string;

  constructor({
    id,
    name,
    description,
    points,
    products,
    pointExchangeRateSetting,
  }: {
    id: string;
    name: string;
    description: string;
    points: PointLog[];
    products: OrderProductStructType[];
    pointExchangeRateSetting: string;
  }) {
    super(id, name, description, products);
    this.points = points;
    this.pointExchangeRateSetting = pointExchangeRateSetting;
  }

  checkout(memberId: string, productIds: string[], productOptions?: { [productId: string]: any }): OrderDiscount[] {
    const exchangeRate = parseInt(this.pointExchangeRateSetting) || 1;

    let totalPrice = this.getTotalPrice();

    const orderDiscounts: OrderDiscount[] = [];

    this.points.forEach((pointLog) => {
      if (totalPrice > 0) {
        const discountPrice = Math.min(totalPrice, Math.floor(pointLog.point * exchangeRate));
        orderDiscounts.push({
          type: OrderDiscountType.Point,
          target: pointLog.id,
          name: `【點數折抵】${pointLog.description}`,
          description: pointLog.description,
          price: discountPrice,
          options: { points: pointLog.point, exchangeRate },
        });

        totalPrice -= discountPrice;
      }
    });

    return orderDiscounts;
  }
}
