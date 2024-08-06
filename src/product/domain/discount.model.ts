import { Coupon } from '~/coupon/entity/coupon.entity';
import { OrderProductStructType } from './product.model';

type OrderDiscountType = 'Coupon' | 'Voucher' | 'Card' | 'DownPrice' | 'Point' | 'Coin';

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
  price: number;
  constructor(id: string, name: string, description: string, price: number, products: OrderProductStructType[]) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.price = price;
    this.products = products;
  }
  abstract checkout(
    memberId: string,
    productIds: string[],
    productOptions?: { [productId: string]: any },
  ): OrderDiscount[];
}

export class CouponDiscount extends Discount {
  coupon: Coupon;
  constructor({
    id,
    name,
    description,
    price,
    coupon,
    products,
  }: {
    id: string;
    name: string;
    description: string;
    price: number;
    coupon: Coupon;
    products: OrderProductStructType[];
  }) {
    super(id, name, description, price, products);
    this.coupon = coupon;
  }
  checkout(memberId: string, productIds: string[], productOptions?: { [productId: string]: any }): OrderDiscount[] {
    if (this.coupon.couponCode.deletedAt) {
      throw new Error('此折價碼不存在');
    }

    if (!this.coupon) {
      throw new Error('此折價券不存在');
    }

    if (this.coupon.memberId !== memberId) {
      throw new Error('無法使用非本人的折價券');
    }

    const available =
      this.coupon.couponStatus.used && !this.coupon.couponStatus.used && !this.coupon.couponStatus.outdated;

    if (!available) {
      throw new Error('無法使用此折價券');
    }

    return [
      {
        type: 'Coupon',
        target: this.id,
        name: `【折價券】${this.name}`,
        description: this.description,
        price: this.price,
      },
    ];
  }
}
