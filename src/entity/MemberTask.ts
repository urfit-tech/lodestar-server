import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Category } from './Category'
import { Member } from './Member'

@Index('member_task_pkey', ['id'], { unique: true })
@Entity('member_task', { schema: 'public' })
export class MemberTask {
  @PrimaryGeneratedColumn()
  id: string

  @Column('text', { name: 'title' })
  title: string

  @Column('text', { name: 'priority', default: () => "'high'" })
  priority: string

  @Column('text', { name: 'status', default: () => "'pending'" })
  status: string

  @Column('timestamp with time zone', { name: 'due_at', nullable: true })
  dueAt: Date | null

  @Column('text', { name: 'description', nullable: true })
  description: string | null

  @Column('timestamp with time zone', {
    name: 'created_at',
    nullable: true,
    default: () => 'now()',
  })
  createdAt: Date | null

  @Column('timestamp with time zone', {
    name: 'updated_at',
    nullable: true,
    default: () => 'now()',
  })
  updatedAt: Date | null

  @ManyToOne(() => Member, member => member.memberTasks, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'author_id', referencedColumnName: 'id' }])
  author: Member

  @ManyToOne(() => Member, member => member.memberTasks2, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'executor_id', referencedColumnName: 'id' }])
  executor: Member

  @ManyToOne(() => Member, member => member.memberTasks3, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'member_id', referencedColumnName: 'id' }])
  member: Member

  @ManyToOne(() => Category, category => category.memberTasks, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'category_id', referencedColumnName: 'id' }])
  category: Category
}
