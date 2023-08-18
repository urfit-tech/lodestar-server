import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { App } from './App';
import { PackageSection } from './PackageSection';

@Index('package_pkey', ['id'], { unique: true })
@Entity('package', { schema: 'public' })
export class Package {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'title' })
  title: string;

  @Column('jsonb', { name: 'elements' })
  elements: object;

  @ManyToOne(() => App, (app) => app.packages, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'app_id', referencedColumnName: 'id' }])
  app: App;

  @OneToMany(() => PackageSection, (packageSection) => packageSection.package)
  packageSections: PackageSection[];
}
