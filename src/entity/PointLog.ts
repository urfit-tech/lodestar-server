import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Member } from '~/member/entity/member.entity';

@Index('point_log_pkey', ['id'], { unique: true })
@Entity('point_log', { schema: 'public' })
export class PointLog {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('text', { name: 'description' })
  description: string

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date

  @Column('numeric', { name: 'point' })
  point: number

  @Column('timestamp with time zone', { name: 'started_at', nullable: true })
  startedAt: Date | null

  @Column('timestamp with time zone', { name: 'ended_at', nullable: true })
  endedAt: Date | null

  @Column('text', { name: 'note', nullable: true })
  note: string | null

  @ManyToOne(() => Member, member => member.pointLogs, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'member_id', referencedColumnName: 'id' }])
  member: Member
}
