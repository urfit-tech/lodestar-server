import { ViewEntity, ViewColumn } from 'typeorm';

@ViewEntity({
  name: 'voucher_status',
})
export class VoucherStatus {
  @ViewColumn()
  voucherId: string;

  @ViewColumn()
  outdated: boolean;

  @ViewColumn()
  used: boolean;
}
