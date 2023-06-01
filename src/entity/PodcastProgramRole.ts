import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Member } from '~/member/entity/member.entity';
import { PodcastProgram } from './PodcastProgram'

@Index('podcast_program_role_pkey', ['id'], { unique: true })
@Entity('podcast_program_role', { schema: 'public' })
export class PodcastProgramRole {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('text', { name: 'name' })
  name: string

  @ManyToOne(() => Member, member => member.podcastProgramRoles, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'member_id', referencedColumnName: 'id' }])
  member: Member

  @ManyToOne(() => PodcastProgram, podcastProgram => podcastProgram.podcastProgramRoles, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'podcast_program_id', referencedColumnName: 'id' }])
  podcastProgram: PodcastProgram
}
