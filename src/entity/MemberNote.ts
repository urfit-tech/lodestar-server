import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Member } from '~/member/entity/member.entity';

@Index('member_note_author_id', ['authorId'], {})
@Index('member_note_created_at_desc', ['createdAt'], {})
@Index('member_note_created_at_asc', ['createdAt'], {})
@Index('member_note_pkey', ['id'], { unique: true })
@Index('member_note_rejected_at', ['rejectedAt'], {})
@Index('member_note_status', ['status'], {})
@Index('member_note_type_outbound', ['type'], {})
@Index('member_note_type', ['type'], {})
@Entity('member_note', { schema: 'public' })
export class MemberNote {
  @PrimaryGeneratedColumn()
  id: string;

  @Column('text', { name: 'member_id' })
  memberId: string;

  @Column('text', { name: 'author_id' })
  authorId: string;

  @Column('text', { name: 'type', nullable: true })
  type: string | null;

  @Column('text', { name: 'status', nullable: true })
  status: string | null;

  @Column('integer', { name: 'duration', default: () => 0 })
  duration: number;

  @Column('text', { name: 'description', nullable: true })
  description: string | null;

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

  @Column('jsonb', { name: 'metadata', nullable: true })
  metadata: object | null;

  @Column('text', { name: 'note', nullable: true })
  note: string | null;

  @Column('timestamp with time zone', { name: 'rejected_at', nullable: true })
  rejectedAt: Date | null;

  @Column('timestamp with time zone', { name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  @Column('text', { name: 'deleted_from', nullable: true })
  deletedFrom: string | null;

  @ManyToOne(() => Member, (member) => member.memberNotes, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'author_id', referencedColumnName: 'id' }])
  author: Member;

  @ManyToOne(() => Member, (member) => member.memberNotes2, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'member_id', referencedColumnName: 'id' }])
  member: Member;
}
