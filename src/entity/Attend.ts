import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Member } from './Member'

@Index('attend_pkey', ['id'], { unique: true })
@Entity('attend', { schema: 'public' })
export class Attend {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('timestamp with time zone', {
    name: 'started_at',
    default: () => 'now()',
  })
  startedAt: Date

  @Column('timestamp with time zone', { name: 'ended_at', nullable: true })
  endedAt: Date | null

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date

  @Column('timestamp with time zone', {
    name: 'updated_at',
    nullable: true,
    default: () => 'now()',
  })
  updatedAt: Date | null

  @ManyToOne(() => Member, member => member.attends, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'member_id', referencedColumnName: 'id' }])
  member: Member
}
