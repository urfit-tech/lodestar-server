import { Discount } from '~/types';

export class OrderDiscountDTO {
  public readonly id: string;
  public readonly type: Discount;
}
