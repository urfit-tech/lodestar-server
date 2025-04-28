import { ProgramPlan } from '~/program/entity/ProgramPlan';
import dayjs from 'dayjs';

type OrderDiscountType = 'Coupon' | 'Voucher' | 'Card' | 'DownPrice' | 'Point' | 'Coin';

type OrderDiscount = {
  name: string;
  description: string | null;
  price: number;
  type: OrderDiscountType;
  target: string;
  options?: { [key: string]: any };
};

class Period {
  constructor(public amount: number, public type: 'D' | 'W' | 'M' | 'Y') {}

  toEndDate(startDate: Date): Date {
    const unit = this.type === 'W' ? 'week' : this.type === 'M' ? 'month' : this.type === 'Y' ? 'year' : 'day';
    return dayjs(startDate).add(this.amount, unit).toDate();
  }
}

export type OrderProductStructType = {
  productId: string;
  name: string;
  description: string;
  price: number;
  autoRenewed: boolean;
  startedAt: Date | null;
  endedAt: Date | null;
  options: { [key: string]: any };
};

export abstract class OrderProductStruct {
  id: string;
  description: string;
  currencyId: string;
  currencyPrice: number;
  options: { [key: string]: any };
  productGiftPlanData: any;

  constructor(currencyId: string, currencyPrice: number, options: { [key: string]: any }, productGiftPlanData: any) {
    this.currencyId = currencyId;
    this.currencyPrice = currencyPrice;
    this.options = options;
    this.productGiftPlanData = productGiftPlanData;
  }

  abstract getDateFromPeriod(periodType: string, periodAmount: number): Date | null;

  abstract checkout(appId: string, options?: { [key: string]: any }): OrderProductStructType;

  async checkoutDiscounts(): Promise<OrderDiscount[]> {
    return [];
  }
}

export class ProgramPlanModel extends OrderProductStruct {
  programPlan: ProgramPlan;
  coinExChangeRateAppSetting: string;

  constructor(
    programPlan: ProgramPlan,
    currencyId: string,
    currencyPrice: number,
    options: { [key: string]: any },
    productGiftPlanData: any,
    coinExChangeRateAppSetting: string,
  ) {
    super(currencyId, currencyPrice, options, productGiftPlanData);
    this.programPlan = programPlan;
    this.id = `ProgramPlan_${programPlan.id}`;
    this.description = '課程方案';
    this.coinExChangeRateAppSetting = coinExChangeRateAppSetting;
  }

  getDateFromPeriod(periodType: string, periodAmount: number): Date | null {
    if (periodType && periodAmount) {
      const period = new Period(periodAmount, periodType as 'D' | 'W' | 'M' | 'Y');
      return period.toEndDate(new Date());
    }
    return null;
  }

  checkout(appId: string, options?: { [key: string]: any }): OrderProductStructType {
    const convertPrice = (appId: string, price: number, fromCurrency: string, toCurrency: string) => {
      return price;
    };

    const convertedPrice = convertPrice(appId, this.currencyPrice, this.currencyId, 'TWD');

    return {
      productId: this.id,
      name: `${this.programPlan.program.title} - ${this.programPlan.title}`,
      description: this.description,
      price: convertedPrice,
      autoRenewed: this.programPlan.autoRenewed,
      startedAt: [1, 3].includes(this.programPlan.type) ? null : new Date(),
      endedAt: this.getDateFromPeriod(this.programPlan.periodType, this.programPlan.periodAmount),
      options: {
        ...this.options,
        ...options,
        currencyId: this.currencyId,
        currencyPrice: this.currencyPrice,
        productGiftPlan: this.productGiftPlanData,
      },
    };
  }

  async checkoutDiscounts(): Promise<OrderDiscount[]> {
    const orderDiscounts: OrderDiscount[] = [];
    if (this.programPlan.discountDownPrice > 0) {
      orderDiscounts.push({
        type: 'DownPrice',
        target: this.id,
        name: `【首期折扣】${this.programPlan.title}`,
        description: '訂閱付費課程',
        price: await this.convertPrice(
          this.programPlan.program.app.id,
          this.programPlan.discountDownPrice,
          this.currencyId,
          'TWD',
        ),
      });
    }
    return orderDiscounts;
  }

  private convertPrice(appId: string, price: number, fromCurrency: string, toCurrency: string) {
    let exchangeRate = 1;
    if (fromCurrency === 'LSC') {
      exchangeRate = parseInt(this.coinExChangeRateAppSetting) || 1;
    }
    const systemPrice = price * exchangeRate;
    const targetPrice = systemPrice * 1;
    return targetPrice;
  }
}
