import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Index('token_pkey', ['id'], { unique: true })
@Entity('token', { schema: 'public' })
export class Token {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('text', { name: 'app_id' })
  appId: string

  @Column('text', { name: 'type' })
  type: string

  @Column('text', { name: 'title' })
  title: string

  @Column('text', { name: 'cover_url', nullable: true })
  coverUrl: string | null

  @Column('numeric', { name: 'price', default: () => 0 })
  price: number

  @Column('text', { name: 'currency_id', default: () => "'TWD'" })
  currencyId: string

  @Column('boolean', { name: 'is_deliverable', default: () => false })
  isDeliverable: boolean

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

  @Column('text', { name: 'abstract', nullable: true })
  abstract: string | null

  @Column('text', { name: 'description', nullable: true })
  description: string | null

  @Column('text', { name: 'tag', nullable: true })
  tag: string | null

  @Column('numeric', { name: 'sale_price', nullable: true })
  salePrice: number | null

  @Column('text', { name: 'plan', nullable: true })
  plan: string | null

  @Column('jsonb', { name: 'options', nullable: true })
  options: object | null

  @Column('boolean', { name: 'is_deleted', default: () => false })
  isDeleted: boolean

  @Column('integer', { name: 'views', default: () => 0 })
  views: number

  @Column('integer', { name: 'clicks', default: () => 0 })
  clicks: number
}
