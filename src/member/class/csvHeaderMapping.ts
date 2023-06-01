import { IsArray, IsNotEmpty, IsString, validateOrReject } from 'class-validator';

import { Category } from '~/definition/entity/category.entity';
import { Property } from '~/definition/entity/property.entity';
import { Tag } from '~/definition/entity/tag.entity';

export class MemberCsvHeaderMapping {
  @IsString() @IsNotEmpty() id: string;
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() username: string;
  @IsString() @IsNotEmpty() email: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  categories: Array<string>;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  properties: Array<string>;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  phones: Array<string>;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  tags: Array<string>;

  @IsString() @IsNotEmpty() star: string;
  @IsString() @IsNotEmpty() createdAt: string;

  public async deserializeFromRaw(
    headerRow: Record<string, string>,
  ): Promise<MemberCsvHeaderMapping> {
    for (const humanReadable in headerRow) {
      const codeReadable = headerRow[humanReadable];
      const [key] = codeReadable.split('.');
      switch (codeReadable) {
        case 'id':
        case 'name':
        case 'username':
        case 'email':
        case 'star':
        case 'createdAt':
          this[key] = humanReadable; continue;
        default:
          if (codeReadable.startsWith('categories.')) {
            this.categories = this.categories 
              ? [...this.categories, humanReadable]
              : [humanReadable];
          } else if (codeReadable.startsWith('properties.')) {
            this.properties = this.properties
              ? [...this.properties, humanReadable]
              : [humanReadable];
          } else if (codeReadable.startsWith('phones.')) {
            this.phones = this.phones
              ? [...this.phones, humanReadable]
              : [humanReadable];
          } else if (codeReadable.startsWith('tags.')) {
            this.tags = this.tags
              ? [...this.tags, humanReadable]
              : [humanReadable];
          }
          continue;
      }
    }

    await validateOrReject(this);
    return this;
  }

  public async serializeToRawRow() {
    const phones = this.phones.reduce((acc, _, index) => {
      acc[`手機${index + 1}`] = `phones.${index + 1}`;
      return acc;
    }, {});
    const categories = this.categories.reduce((acc, _, index) => {
      acc[`分類${index + 1}`] = `categories.${index + 1}`;
      return acc;
    }, {});
    const properties = this.properties.reduce((acc, current, index) => {
      acc[current] = `properties.${index + 1}`;
      return acc;
    }, {});
    const tags = this.tags.reduce((acc, _, index) => {
      acc[`標籤${index + 1}`] = `tags.${index + 1}`;
      return acc;
    }, {});
    return {
      ['流水號']: 'id',
      ['姓名']: 'name',
      ['帳號']: 'username',
      ['信箱']: 'email',
      ['星等']: 'star',
      ['建立日期']: 'createdAt',
      ...phones,
      ...categories,
      ...properties,
      ...tags,
    };
  }

  public async deserializeFromDataBase(
    maxPhoneCount: number,
    appCategories: Array<Category>,
    appProperties: Array<Property>,
    appTags: Array<Tag>,
  ) {
    this.id = '流水號';
    this.name = '姓名';
    this.username = '帳號';
    this.email = '信箱';
    this.categories = [...Array(appCategories.length).keys()].map((each) => `分類${(each + 1).toString()}`);
    this.properties = appProperties.map(({ name }) => name);
    this.phones = [...Array(maxPhoneCount).keys()].map((each) => `手機${(each + 1).toString()}`);
    this.tags = [...Array(appTags.length).keys()].map((each) => `標籤${(each + 1).toString()}`);
    this.star = '星等';
    this.createdAt = '建立日期';

    return this;
  }
}
