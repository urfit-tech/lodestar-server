import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { Member } from '~/member/entity/member.entity';
import { PlaylistPodcastProgram } from './PlaylistPodcastProgram'

@Index('playlist_pkey', ['id'], { unique: true })
@Entity('playlist', { schema: 'public' })
export class Playlist {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date

  @Column('timestamp with time zone', {
    name: 'updated_at',
    default: () => 'now()',
  })
  updatedAt: Date

  @Column('text', { name: 'title' })
  title: string

  @Column('integer', { name: 'position', default: () => 0 })
  position: number

  @ManyToOne(() => Member, member => member.playlists, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'member_id', referencedColumnName: 'id' }])
  member: Member

  @OneToMany(() => PlaylistPodcastProgram, playlistPodcastProgram => playlistPodcastProgram.playlist)
  playlistPodcastPrograms: PlaylistPodcastProgram[]
}
