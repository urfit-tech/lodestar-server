import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index('exam_member_time_limit_exam_id_member_id_key', ['examId', 'memberId'], {
  unique: true,
})
@Index('exam_member_time_limit_pkey', ['id'], { unique: true })
@Entity('exam_member_time_limit', { schema: 'public' })
export class ExamMemberTimeLimit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'exam_id', unique: true })
  examId: string;

  @Column('text', { name: 'member_id', unique: true })
  memberId: string;

  @Column('timestamp with time zone', { name: 'expired_at' })
  expiredAt: Date;

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

  @Column('uuid', { name: 'editor_id', nullable: true })
  editorId: string | null;
}
