import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryColumn } from 'typeorm';
import { PackageItem } from './PackageItem';
import { PackageSection } from './PackageSection';

@Index('package_item_group_pkey', ['id'], { unique: true })
@Entity('package_item_group', { schema: 'public' })
export class PackageItemGroup {
  @PrimaryColumn()
  id: string;

  @Column('text', { name: 'title' })
  title: string;

  @Column('text', { name: 'subtitle' })
  subtitle: string;

  @Column('text', { name: 'type' })
  type: string;

  @Column('boolean', { name: 'with_filter' })
  withFilter: boolean;

  @OneToMany(() => PackageItem, (packageItem) => packageItem.packageItemGroup)
  packageItems: PackageItem[];

  @ManyToOne(() => PackageSection, (packageSection) => packageSection.packageItemGroups, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'package_section_id', referencedColumnName: 'id' }])
  packageSection: PackageSection;
}
