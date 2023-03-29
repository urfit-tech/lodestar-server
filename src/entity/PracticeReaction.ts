import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Index('practice_reaction_pkey', ['id'], { unique: true })
@Entity('practice_reaction', { schema: 'public' })
export class PracticeReaction {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date

  @Column('text', { name: 'member_id' })
  memberId: string

  @Column('uuid', { name: 'practice_id' })
  practiceId: string
}
