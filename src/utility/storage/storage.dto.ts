import { IsString } from 'class-validator';

export class UploadDTO {
  @IsString()
  appId: string;

  @IsString()
  fileName: string;
}
