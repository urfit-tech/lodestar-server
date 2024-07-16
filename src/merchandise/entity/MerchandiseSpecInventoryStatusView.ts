import { ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity('merchandise_spec_inventory_status', { schema: 'public' })
export class MerchandiseSpecInventoryStatusView {
  @ViewColumn({ name: 'merchandise_spec_id' })
  merchandiseSpecId: string;

  @ViewColumn({ name: 'total_quantity' })
  totalQuantity: number;

  @ViewColumn({ name: 'undelivered_quantity' })
  undeliveredQuantity: number;

  @ViewColumn({ name: 'delivered_quantity' })
  delivered_quantity: number;

  @ViewColumn({ name: 'buyable_quantity' })
  buyableQuantity: number;

  @ViewColumn({ name: 'unpaid_quantity' })
  unpaidQuantity: number;
}
