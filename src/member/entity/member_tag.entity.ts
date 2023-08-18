import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Tag } from '~/definition/entity/tag.entity';

import { Member } from './member.entity';

@Index('member_tag_pkey', ['id'], { unique: true })
@Index('member_tag_member_id_tag_name_key', ['memberId', 'tagName'], {
  unique: true,
})
@Entity('member_tag', { schema: 'public' })
export class MemberTag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'member_id', unique: true })
  memberId: string;

  @Column('text', { name: 'tag_name', unique: true })
  tagName: string;

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

  @Column('integer', { name: 'position', default: () => 0 })
  position: number;

  @ManyToOne(() => Member, (member) => member.memberTags, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'member_id', referencedColumnName: 'id' }])
  member: Member;

  @ManyToOne(() => Tag, (tag) => tag.memberTags, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'tag_name', referencedColumnName: 'name' }])
  tagName2: Tag;
}
