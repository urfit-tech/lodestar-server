import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Category } from '~/definition/entity/category.entity';

import { Member } from './member.entity';

@Index('member_category_member_id_category_id_key', ['categoryId', 'memberId'], { unique: true })
@Index('member_category_pkey', ['id'], { unique: true })
@Entity('member_category', { schema: 'public' })
export class MemberCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'member_id', unique: true })
  memberId: string;

  @Column('text', { name: 'category_id', unique: true })
  categoryId: string;

  @Column('integer', { name: 'position' })
  position: number;

  @ManyToOne(() => Member, (member) => member.memberCategories, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'member_id', referencedColumnName: 'id' }])
  member: Member;

  @ManyToOne(() => Category, (category) => category.memberCategories, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'category_id', referencedColumnName: 'id' }])
  category: Category;
}
