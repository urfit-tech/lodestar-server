import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Member } from '~/member/entity/member.entity';

@Index('member_tracking_log_pkey', ['id'], { unique: true })
@Entity('member_tracking_log', { schema: 'public' })
export class MemberTrackingLog {
  @PrimaryGeneratedColumn()
  id: string;

  @Column('text', { name: 'member_id', unique: true })
  memberId: string;

  @Column('text', { name: 'source', nullable: true })
  source: string | null;

  @Column('text', { name: 'medium', nullable: true })
  medium: string | null;

  @Column('text', { name: 'landing', nullable: true })
  landing: string | null;

  @Column('text', { name: 'referrer', nullable: true })
  referrer: string | null;

  @Column('text', { name: 'campaign', nullable: true })
  campaign: string | null;

  @Column('text', { name: 'content', nullable: true })
  content: string | null;

  @Column('text', { name: 'brand', nullable: true })
  brand: string | null;

  @Column('text', { name: 'adgroup', nullable: true })
  adgroup: string | null;

  @Column('text', { name: 'adname', nullable: true })
  adname: string | null;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @ManyToOne(() => Member, (member) => member.memberTrackingLogs, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'member_id', referencedColumnName: 'id' }])
  member: Member;
}
