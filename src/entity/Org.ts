import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Index('organization_pkey', ['id'], { unique: true })
@Entity('org', { schema: 'public' })
export class Org {
  @PrimaryColumn()
  id: string;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @Column('timestamp with time zone', {
    name: 'updated_at',
    default: () => 'now()',
  })
  updatedAt: Date;
}
