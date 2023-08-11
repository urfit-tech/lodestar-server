import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class FileInfo {
  @IsString()
  key: string;

  @IsString()
  checksum: string;
}

export class MemberGetConditionDTO {
  @IsString()
  @IsOptional()
  role?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  username?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  managerName?: string;

  @IsString()
  @IsOptional()
  managerId?: string;
}

export class MemberGetResultDTO {
  id: string;
  picture_url: string;
  name: string;
  email: string;
  role: string;
  created_at: Date;
  username: string;
  logined_at: Date;
  manager_id: string;
}

export class MemberImportDTO {
  @IsString()
  appId: string;

  @ValidateNested()
  @Type(() => FileInfo)
  fileInfos: Array<FileInfo>;
}

export class MemberExportDTO {
  @IsString()
  appId: string;

  @IsArray()
  @IsString({ each: true })
  memberIds: Array<string>;

  @IsString()
  @IsOptional()
  exportMime?: string;
}

export class MemberImportResultDTO {
  toInsertCount: number;
  insertedCount: number;
  failedCount: number;
  failedErrors: any;
}
