import { IsString, IsArray, IsObject, IsUUID, IsNotEmpty, IsNumber, IsDate, IsEmail, validateSync } from 'class-validator';

import { MemberCsvHeaderMappingInfo } from '../member.type';

/**
 * Formats represents raw rows inside csv file for member import.
 */
export class CsvRawMember {  
  @IsUUID()
  @IsNotEmpty()
  id: string;
  
  @IsString()
  @IsNotEmpty()
  name: string;
  
  @IsString()
  @IsNotEmpty()
  username: string;
  
  @IsEmail()
  email: string;

  @IsArray()
  @IsString({ each: true })
  categories: Array<string>;
  
  @IsObject()
  properties: Record<string, string>;
  
  @IsArray()
  @IsString({ each: true })
  phones: Array<string>;
  
  @IsArray()
  @IsString({ each: true })
  tags: Array<string>;
  
  @IsNumber()
  star: number;
  
  @IsDate()
  createdAt: Date;

  public serializeToCsvRawRow(
    header: MemberCsvHeaderMappingInfo,
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
      [header.createdAt]: this.createdAt,
      ...phones,
      ...categories,
      ...properties,
      ...tags,
    };
  }

  public deserializedFromCsvRawRow(
    header: MemberCsvHeaderMappingInfo,
    row: Record<string, any>,
  ): CsvRawMember {
    this.id = row[header.id];
    this.name = row[header.name];
    this.username = row[header.username];
    this.email = row[header.email];
    this.star = parseInt(row[header.star]);
    this.createdAt = new Date(row[header.createdAt]);
    this.phones = header.phones.map((each) => row[each]);
    this.categories = header.categories.map((each) => row[each]);
    this.properties = header.properties.reduce(
      (acc, current) => {
        acc[current] = row[current];
        return acc;
      },
      {},
    );
    this.tags = header.tags.map((each) => row[each]);
    validateSync(this);
    return this;
  }
}
