import {
  IsString,
  IsArray,
  IsObject,
  IsUUID,
  IsEmail,
  validateSync,
  isEmpty,
  isNotEmpty,
  ValidationError,
  IsOptional,
  IsNumberString,
  IsDateString,
  IsNotEmpty,
  IsEmpty,
} from 'class-validator';

import { parseFieldFromRaw, parseNullableFieldFromRaw } from '~/utils';

import { MemberCsvHeaderMapping } from './csvHeaderMapping';

/**
 * Formats represents raw rows inside csv file for member import.
 */
export class CsvRawMember {  
  @IsUUID(4, { groups: ['import-exists'] })
  @IsEmpty({ groups: ['import-new'] })
  id: string | null | undefined;

  @IsString() @IsOptional() name: string | undefined;

  @IsString({ always: true })
  @IsOptional({ groups: ['import-exists'] })
  @IsNotEmpty({ groups: ['import-new'] })
  username: string | null | undefined;

  @IsEmail(undefined, { always: true })
  @IsOptional({ groups: ['import-exists'] })
  @IsNotEmpty({ groups: ['import-new'] })
  email: string | null | undefined;

  @IsString() @IsOptional() role: string | undefined;

  @IsNumberString(undefined, { always: true })
  @IsOptional({ groups: ['import-exists'] })
  @IsNotEmpty({ groups: ['import-new'] })
  star: string | null | undefined;

  @IsDateString(undefined, { always: true })
  @IsOptional({ always: true })
  createdAt: string | null | undefined;

  @IsDateString(undefined, { always: true })
  @IsOptional({ always: true })
  loginedAt: string | null | undefined;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories: Array<string> | undefined;
  
  @IsOptional()
  @IsObject()
  properties: Record<string, string> | undefined;
  
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  phones: Array<string> | undefined;
  
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags: Array<string> | undefined;

  public serializeToCsvRawRow(
    header: MemberCsvHeaderMapping,
  ): Record<string, string | number | Date> {
    const phones = header.phones.reduce((acc, _, index) => {
      acc[`手機${index + 1}`] = this.phones.length > index ? this.phones[index] : '';
      return acc;
    }, {});
    const categories = header.categories.reduce((acc, _, index) => {
      acc[`分類${index + 1}`] = this.categories.length > index ? this.categories[index] : '';
      return acc;
    }, {});
    const properties = header.properties.reduce((acc, current) => {
      acc[current] = this.properties[current] || '';
      return acc;
    }, {});
    const tags = header.tags.reduce((acc, _, index) => {
      acc[`標籤${index + 1}`] = this.tags.length > index ? this.tags[index] : '';
      return acc;
    }, {});
    return {
      [header.id]: this.id,
      [header.name]: this.name,
      [header.username]: this.username,
      [header.email]: this.email,
      [header.star]: this.star,
      [header.role]: this.role,
      [header.createdAt]: this.createdAt,
      [header.loginedAt]: this.loginedAt,
      ...phones,
      ...categories,
      ...properties,
      ...tags,
    };
  }

  public deserializedFromCsvRawRow(
    header: MemberCsvHeaderMapping,
    row: Record<string, any>,
  ): [CsvRawMember, Array<ValidationError>] {
    this.id = parseNullableFieldFromRaw<string>(row[header.id]);
    this.name = parseFieldFromRaw<string>(row[header.name]);
    this.username = parseFieldFromRaw<string>(row[header.username]);
    this.email = parseFieldFromRaw<string>(row[header.email]);
    
    this.star = parseNullableFieldFromRaw<string>(row[header.star]);
    this.role = parseNullableFieldFromRaw<string>(row[header.role]);
    this.createdAt = parseNullableFieldFromRaw<string>(row[header.createdAt]);
    this.loginedAt = parseNullableFieldFromRaw<string>(row[header.loginedAt]);

    this.phones = [
      ...new Set((header.phones === undefined ? [] : header.phones)
        .map((each) => row[each].toString())
        .filter(isNotEmpty)),
    ];
    this.categories = (header.categories === undefined ? [] : header.categories)
      .map((each) => row[each])
      .filter(isNotEmpty);
    this.properties = (header.properties === undefined ? [] : header.properties)
      .reduce(
        (acc, current) => {
          const value = row[current];
          if (isNotEmpty(value)) {
            acc[current] = row[current];
          }
          return acc;
        },
        {},
      );
    this.tags = (header.tags === undefined ? [] : header.tags)
      .map((each) => row[each])
      .filter(isNotEmpty);
    return [this, validateSync(this, { groups: [
      isEmpty(row[header.id]) ? 'import-new' : 'import-exists',
    ]})];
  }
}
