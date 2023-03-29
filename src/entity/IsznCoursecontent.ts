import { Column, Entity, Index, PrimaryColumn } from 'typeorm'

@Index('iszn_coursecontent_pkey', ['id'], { unique: true })
@Entity('iszn_coursecontent', { schema: 'public' })
export class IsznCoursecontent {
  @PrimaryColumn()
  id: string

  @Column('text', { name: 'title' })
  title: string

  @Column('boolean', { name: 'istrial' })
  istrial: boolean

  @Column('timestamp with time zone', { name: 'createdat' })
  createdat: Date

  @Column('timestamp with time zone', { name: 'updatedat' })
  updatedat: Date

  @Column('integer', { name: 'order' })
  order: number

  @Column('uuid', { name: 'unitid' })
  unitid: string

  @Column('uuid', { name: 'courseresourceid', nullable: true })
  courseresourceid: string | null

  @Column('numeric', { name: 'duration', nullable: true })
  duration: number | null
}
