import { Type } from 'class-transformer';
import { IsArray, IsString, ValidateNested } from 'class-validator';

class FileInfo {
  @IsString()
  key: string;

  @IsString()
  checksum: string;
}

export class CoinImportDTO {
  @IsString()
  appId: string;

  @IsArray()
  @ValidateNested()
  @Type(() => FileInfo)
  fileInfos: Array<FileInfo>;
}

export class CoinImportResultDTO {
  toInsertCount: number;
  insertedCount: number;
  failedCount: number;
  failedErrors: any;
}
