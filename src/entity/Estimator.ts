import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Index('estimator_pkey', ['id'], { unique: true })
@Index('estimator_id_key', ['id'], { unique: true })
@Entity('estimator', { schema: 'public' })
export class Estimator {
  @PrimaryGeneratedColumn()
  id: string

  @Column('text', { name: 'name' })
  name: string

  @Column('numeric', { name: 'list_price' })
  listPrice: number

  @Column('numeric', { name: 'sale_price', nullable: true })
  salePrice: number | null

  @Column('timestamp with time zone', { name: 'sold_at', nullable: true })
  soldAt: Date | null

  @Column('timestamp with time zone', { name: 'published_at', nullable: true })
  publishedAt: Date | null

  @Column('text', { name: 'source_url' })
  sourceUrl: string

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date

  @Column('timestamp with time zone', {
    name: 'updated_at',
    default: () => 'now()',
  })
  updatedAt: Date
}
