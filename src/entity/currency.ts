import {
  Entity,
  PrimaryColumn,
  Column,
} from 'typeorm';

@Entity()
export class Currency {
  @PrimaryColumn({ type: 'text', nullable: false })
  id!: string;

  @Column({ type: 'text', nullable: false })
  label!: string;

  @Column({ type: 'text', nullable: false })
  unit!: string;

  @Column({ type: 'text', nullable: false })
  name!: string;

  @Column({
    name: 'minor_units',
    type: 'int4',
    nullable: false,
    default: 0,
  })
  minorUnits!: number;
}
