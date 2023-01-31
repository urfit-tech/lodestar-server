import { Column } from 'typeorm';

export class BaseEntity {
  @Column({
    name: 'created_at',
    type: 'timestamp with time zone',
    nullable: false,
    default: 'NOW()',
  })
  createdAt!: Date;

  @Column({
    name: 'updated_at',
    type: 'timestamp with time zone',
    nullable: false,
    default: 'NOW()',
  })
  updatedAt!: Date;
}
