import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Activity } from './Activity';
import { PackageItemGroup } from './PackageItemGroup';
import { Program } from './Program';

@Index('package_item_pkey', ['id'], { unique: true })
@Entity('package_item', { schema: 'public' })
export class PackageItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'merchandise_id', nullable: true })
  merchandiseId: string | null;

  @ManyToOne(() => Activity, (activity) => activity.packageItems, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'activity_id', referencedColumnName: 'id' }])
  activity: Activity;

  @ManyToOne(() => PackageItemGroup, (packageItemGroup) => packageItemGroup.packageItems, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'package_item_group_id', referencedColumnName: 'id' }])
  packageItemGroup: PackageItemGroup;

  @ManyToOne(() => Program, (program) => program.packageItems, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'program_id', referencedColumnName: 'id' }])
  program: Program;
}
