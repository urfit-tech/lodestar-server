import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Merchandise } from './Merchandise';
import { MerchandiseSpecFile } from './MerchandiseSpecFile';

@Index('merchandise_spec_pkey', ['id'], { unique: true })
@Entity('merchandise_spec', { schema: 'public' })
export class MerchandiseSpec {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'title', default: () => "'Untitled'" })
  title: string;

  @Column('numeric', { name: 'list_price', default: () => 0 })
  listPrice: number;

  @Column('numeric', { name: 'sale_price', nullable: true })
  salePrice: number | null;

  @Column('integer', { name: 'quota', default: () => -1 })
  quota: number;

  @Column('timestamp with time zone', {
    name: 'created_at',
    nullable: true,
    default: () => 'now()',
  })
  createdAt: Date | null;

  @Column('timestamp with time zone', {
    name: 'updated_at',
    nullable: true,
    default: () => 'now()',
  })
  updatedAt: Date | null;

  @Column('boolean', { name: 'is_deleted', default: () => false })
  isDeleted: boolean;

  @ManyToOne(() => Merchandise, (merchandise) => merchandise.merchandiseSpecs, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'merchandise_id', referencedColumnName: 'id' }])
  merchandise: Merchandise;

  @OneToMany(() => MerchandiseSpecFile, (merchandiseSpecFile) => merchandiseSpecFile.merchandiseSpec)
  merchandiseSpecFiles: MerchandiseSpecFile[];
}
