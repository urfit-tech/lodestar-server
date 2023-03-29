import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryColumn } from 'typeorm'
import { Package } from './Package'
import { PackageItemGroup } from './PackageItemGroup'

@Index('package_section_pkey', ['id'], { unique: true })
@Entity('package_section', { schema: 'public' })
export class PackageSection {
  @PrimaryColumn()
  id: string

  @Column('text', { name: 'title' })
  title: string

  @Column('text', { name: 'subtitle' })
  subtitle: string

  @Column('text', { name: 'description' })
  description: string

  @Column('boolean', { name: 'block' })
  block: boolean

  @Column('integer', { name: 'position' })
  position: number

  @OneToMany(() => PackageItemGroup, packageItemGroup => packageItemGroup.packageSection)
  packageItemGroups: PackageItemGroup[]

  @ManyToOne(() => Package, pkg => pkg.packageSections, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'package_id', referencedColumnName: 'id' }])
  package: Package
}
