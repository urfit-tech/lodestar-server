import { Column, Entity, Index, OneToMany, PrimaryColumn } from 'typeorm';

import { OrderProduct } from '~/order/entity/order_product.entity';

import { AppointmentPlan } from './AppointmentPlan';
import { ProgramPlan } from './ProgramPlan';

@Index('currency_pkey', ['id'], { unique: true })
@Entity('currency', { schema: 'public' })
export class Currency {
  @PrimaryColumn()
  id: string;

  @Column('text', { name: 'label' })
  label: string;

  @Column('text', { name: 'unit' })
  unit: string;

  @Column('text', { name: 'name' })
  name: string;

  @Column('integer', {
    name: 'minor_units',
    nullable: true,
    default: () => 0,
  })
  minorUnits: number | null;

  @OneToMany(() => AppointmentPlan, (appointmentPlan) => appointmentPlan.currency)
  appointmentPlans: AppointmentPlan[];

  @OneToMany(() => OrderProduct, (orderProduct) => orderProduct.currency)
  orderProducts: OrderProduct[];

  @OneToMany(() => ProgramPlan, (programPlan) => programPlan.currency)
  programPlans: ProgramPlan[];
}
