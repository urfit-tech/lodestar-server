import { IsArray, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export interface TransferReceivedOrderDTO {
  memberId: string;
  orderId: string;
}

export interface TransferReceivedOrderBodyDTO {
  token: string;
  memberId: string;
}

export class OrderExportDTO {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  statuses: Array<
    'UNPAID' | 'SUCCESS' | 'PAYING' | 'FAILED' | 'REFUND' | 'EXPIRED' | 'DELETED' | 'PARTIAL_REFUND' | 'PARTIAL_PAID'
  >;

  @IsOptional()
  @IsObject()
  createdAt: {
    startedAt: string;
    endedAt: string;
  };

  @IsOptional()
  @IsObject()
  lastPaidAt: {
    startedAt: string;
    endedAt: string;
  };

  @IsOptional()
  @IsArray()
  @IsNotEmpty()
  productIds: Array<string>;

  @IsOptional()
  @IsArray()
  @IsNotEmpty()
  couponPlanIds: Array<string>;

  @IsOptional()
  @IsArray()
  @IsNotEmpty()
  voucherPlanIds: Array<string>;

  /**
   * a parameter controlling whether export csv or xlsx
   */
  @IsString()
  @IsOptional()
  exportMime?: 'text/csv' | 'xlsx';

  /**
   * a parameter controlling timezone
   */
  @IsString()
  timezone: string;
}
