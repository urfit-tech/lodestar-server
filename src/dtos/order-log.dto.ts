export class OrderLogBaseDTO {
  public readonly target: string;
  public readonly type: 'Coupon' | 'Voucher' | 'Card' | 'DownPrice';
}
