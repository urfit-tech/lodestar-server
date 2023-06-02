import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Member } from '~/member/entity/member.entity';

@Index('creator_display_member_id_block_id_key', ['blockId', 'memberId'], {
  unique: true,
})
@Index('creator_display_pkey', ['id'], { unique: true })
@Entity('creator_display', { schema: 'public' })
export class CreatorDisplay {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('text', {
    name: 'block_id',
    unique: true,
    default: () => "'default'",
  })
  blockId: string

  @Column('text', { name: 'member_id', unique: true })
  memberId: string

  @Column('integer', { name: 'position', default: () => -1 })
  position: number

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

  @ManyToOne(() => Member, member => member.creatorDisplays, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'member_id', referencedColumnName: 'id' }])
  member: Member
}
