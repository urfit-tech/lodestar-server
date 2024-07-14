import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Merchandise } from './Merchandise';
import { Tag } from '~/definition/entity/tag.entity';

@Index('merchandise_tag_pkey', ['id'], { unique: true })
@Entity('merchandise_tag', { schema: 'public' })
export class MerchandiseTag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('integer', { name: 'position', default: () => 0 })
  position: number;

  @ManyToOne(() => Merchandise, (merchandise) => merchandise.merchandiseTags, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'merchandise_id', referencedColumnName: 'id' }])
  merchandise: Merchandise;

  @ManyToOne(() => Tag, (tag) => tag.merchandiseTags, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'tag_name', referencedColumnName: 'name' }])
  tagName: Tag;
}
