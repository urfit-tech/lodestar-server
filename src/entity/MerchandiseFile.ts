import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Merchandise } from './Merchandise'

@Index('merchandise_file_pkey', ['id'], { unique: true })
@Entity('merchandise_file', { schema: 'public' })
export class MerchandiseFile {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('jsonb', { name: 'data' })
  data: object

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

  @ManyToOne(() => Merchandise, merchandise => merchandise.merchandiseFiles, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'merchandise_id', referencedColumnName: 'id' }])
  merchandise: Merchandise
}
