import {
  IsArray,
  IsNotEmpty,
  IsString,
  validateSync,
  ValidationError,
  ValidateIf,
} from 'class-validator';

import { Category } from '~/definition/entity/category.entity';
import { Property } from '~/definition/entity/property.entity';

export class MemberCsvHeaderMapping {
  @IsString() @IsNotEmpty() id: string;
  
  @IsString()
  @IsNotEmpty()
  @ValidateIf((_, value) => value === undefined)
  name: string;
  
  @IsString()
  @IsNotEmpty()
  @ValidateIf((_, value) => value === undefined)
  username: string;
  
  @IsString()
  @IsNotEmpty()
  @ValidateIf((_, value) => value === undefined)
  email: string;

  @IsString()
  @IsNotEmpty()
  @ValidateIf((_, value) => value === undefined)
  role: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  @ValidateIf((_, value) => value === undefined)
  categories: Array<string>;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  @ValidateIf((_, value) => value === undefined)
  properties: Array<string>;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  @ValidateIf((_, value) => value === undefined)
  phones: Array<string>;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  @ValidateIf((_, value) => value === undefined)
  tags: Array<string>;

  @IsString()
  @IsNotEmpty()
  @ValidateIf((_, value) => value === undefined)
  star: string;

  @IsString()
  @IsNotEmpty()
  @ValidateIf((_, value) => value === undefined)
  createdAt: string;

  @IsString()
  @IsNotEmpty()
  @ValidateIf((_, value) => value === undefined)
  loginedAt: string;

  public deserializeFromRaw(
    headerRow: Record<string, string>,
  ): [MemberCsvHeaderMapping, Array<ValidationError>] {
    for (const humanReadable in headerRow) {
      const codeReadable = headerRow[humanReadable];
      const [key] = codeReadable.split('.');
      switch (codeReadable) {
        case 'id':
        case 'name':
        case 'username':
        case 'email':
        case 'role':
        case 'star':
        case 'createdAt':
        case 'loginedAt':
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

    return [this, validateSync(this)];
  }

  public async deserializeFromDataBase(
    maxPhoneCount: number,
    maxTagCount: number,
    appCategories: Array<Category>,
    appProperties: Array<Property>,
  ) {
    this.id = '流水號';
    this.name = '姓名';
    this.username = '帳號';
    this.email = '信箱';
    this.categories = [...Array(appCategories.length).keys()].map((each) => `分類${(each + 1).toString()}`);
    this.properties = appProperties.map(({ name }) => name);
    this.phones = [...Array(maxPhoneCount).keys()].map((each) => `手機${(each + 1).toString()}`);
    this.tags = [...Array(maxTagCount).keys()].map((each) => `標籤${(each + 1).toString()}`);
    this.star = '星等';
    this.role = '身份';
    this.createdAt = '建立日期';
    this.loginedAt = '上次登入日期';

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
      ['身份']: 'role',
      ['建立日期']: 'createdAt',
      ['上次登入日期']: 'loginedAt',
      ...phones,
      ...categories,
      ...properties,
      ...tags,
    };
  }
}
