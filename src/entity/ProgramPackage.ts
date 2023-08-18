import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { App } from './App';
import { ProgramPackageCategory } from './ProgramPackageCategory';
import { ProgramPackagePlan } from './ProgramPackagePlan';
import { ProgramPackageProgram } from './ProgramPackageProgram';

@Index('program_package_app_id', ['appId'], {})
@Index('program_package_pkey', ['id'], { unique: true })
@Entity('program_package', { schema: 'public' })
export class ProgramPackage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'title' })
  title: string;

  @Column('text', { name: 'cover_url', nullable: true })
  coverUrl: string | null;

  @Column('text', { name: 'description', nullable: true })
  description: string | null;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @Column('timestamp with time zone', { name: 'published_at', nullable: true })
  publishedAt: Date | null;

  @Column('text', { name: 'app_id' })
  appId: string;

  @Column('text', { name: 'creator_id', nullable: true })
  creatorId: string | null;

  @Column('jsonb', { name: 'meta_tag', nullable: true })
  metaTag: object | null;

  @Column('boolean', { name: 'is_private', default: () => false })
  isPrivate: boolean;

  @ManyToOne(() => App, (app) => app.programPackages, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'app_id', referencedColumnName: 'id' }])
  app: App;

  @OneToMany(() => ProgramPackageCategory, (programPackageCategory) => programPackageCategory.programPackage)
  programPackageCategories: ProgramPackageCategory[];

  @OneToMany(() => ProgramPackagePlan, (programPackagePlan) => programPackagePlan.programPackage)
  programPackagePlans: ProgramPackagePlan[];

  @OneToMany(() => ProgramPackageProgram, (programPackageProgram) => programPackageProgram.programPackage)
  programPackagePrograms: ProgramPackageProgram[];
}
