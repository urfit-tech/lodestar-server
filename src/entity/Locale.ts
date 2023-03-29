import { Column, Entity, Index, PrimaryColumn } from 'typeorm'

@Index('locale_pkey', ['key'], { unique: true })
@Entity('locale', { schema: 'public' })
export class Locale {
  @PrimaryColumn()
  key: string

  @Column('text', { name: 'zh' })
  zh: string

  @Column('text', { name: 'zh_cn' })
  zhCn: string

  @Column('text', { name: 'en' })
  en: string

  @Column('text', { name: 'vi' })
  vi: string

  @Column('text', { name: 'zh_acsi' })
  zhAcsi: string
}
