import { IsEmail, IsDate, IsString, IsArray, IsObject } from 'class-validator';

/**
 * Formats represents raw rows inside csv file for member import.
 */
export class CsvRawMemberDTO {  
  id: string;
  
  name: string;
  
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
  
  star: string;
  
  @IsDate()
  createdAt: Date;
}
