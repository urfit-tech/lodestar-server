import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index('service_pkey', ['id'], { unique: true })
@Entity('service', { schema: 'public' })
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'name' })
  name: string;

  @Column('text', { name: 'gateway' })
  gateway: string;

  @Column('text', { name: 'catalog' })
  catalog: string;

  @Column('jsonb', { name: 'options' })
  options: object;

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
