import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Cursor } from 'typeorm-cursor-pagination';

class FileInfo {
  @IsString()
  key: string;

  @IsString()
  checksum: string;
}

export class MemberGetQueryOptionsDTO {
  @IsOptional()
  @IsString()
  prevToken?: string;

  @IsOptional()
  @IsString()
  nextToken?: string;

  @IsOptional()
  @IsNumber()
  limit?: number;
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

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  managerName?: string;

  @IsString()
  @IsOptional()
  managerId?: string;
}

export class MemberGetDTO {
  @IsOptional()
  @ValidateNested()
  @Type(() => MemberGetQueryOptionsDTO)
  option?: MemberGetQueryOptionsDTO;

  @IsOptional()
  @ValidateNested()
  @Type(() => MemberGetConditionDTO)
  condition?: MemberGetConditionDTO;
}

export class MemberGetResultDTO {
  cursor: Cursor;
  data: Array<{
    id: string;
    picture_url: string;
    name: string;
    email: string;
    role: string;
    created_at: Date;
    username: string;
    logined_at: Date;
    manager_id: string;
  }>;
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
