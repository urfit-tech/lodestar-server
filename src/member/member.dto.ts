import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';

class FileInfo {
  @IsString()
  key: string;

  @IsString()
  checksum: string;
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
