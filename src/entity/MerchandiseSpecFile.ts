import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { MerchandiseSpec } from './MerchandiseSpec'

@Index('merchandise_spec_file_pkey', ['id'], { unique: true })
@Entity('merchandise_spec_file', { schema: 'public' })
export class MerchandiseSpecFile {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('jsonb', { name: 'data', nullable: true })
  data: object | null

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

  @ManyToOne(() => MerchandiseSpec, merchandiseSpec => merchandiseSpec.merchandiseSpecFiles, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'merchandise_spec_id', referencedColumnName: 'id' }])
  merchandiseSpec: MerchandiseSpec
}
