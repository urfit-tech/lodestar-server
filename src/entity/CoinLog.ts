import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Member } from '~/member/entity/member.entity';

@Index('coin_log_pkey', ['id'], { unique: true })
@Entity('coin_log', { schema: 'public' })
export class CoinLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @Column('text', { name: 'title' })
  title: string;

  @Column('text', { name: 'description' })
  description: string;

  @Column('text', { name: 'note', nullable: true })
  note: string | null;

  @Column('numeric', { name: 'amount' })
  amount: number;

  @Column('timestamp with time zone', { name: 'started_at', nullable: true })
  startedAt: Date | null;

  @Column('timestamp with time zone', { name: 'ended_at', nullable: true })
  endedAt: Date | null;

  @Column('text', { name: 'member_id' })
  memberId: string;

  @ManyToOne(() => Member, (member) => member.coinLogs, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'member_id', referencedColumnName: 'id' }])
  member: Member;
}
