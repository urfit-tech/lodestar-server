import { IsEmail, IsDate, IsString, IsArray, IsObject, IsUUID, IsNotEmpty, IsNumber } from 'class-validator';

/**
 * Formats represents raw rows inside csv file for member import.
 */
export class CsvRawMemberDTO {  
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
}
