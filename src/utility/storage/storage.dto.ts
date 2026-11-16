import { CompletedMultipartUpload } from '@aws-sdk/client-s3';
import {
  IsDefined,
  IsNotEmpty,
  IsNotEmptyObject,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UploadDTO {
  @IsString()
  appId: string;

  @IsString()
  fileName: string;

  @IsString()
  prefix: string;
}

export class DownloadDTO {
  @IsString()
  appId: string;

  @IsString()
  fileName: string;

  @IsString()
  prefix: string;
}
class CreateMultipartUploadParams {
  @IsNotEmpty()
  @IsString()
  Key: string;

  @IsNotEmpty()
  @IsString()
  ContentType: string;
}
export class CreateMultipartUploadDTO {
  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => CreateMultipartUploadParams)
  params: CreateMultipartUploadParams;
}

class SignMultipartUploadParams {
  @IsNotEmpty()
  @IsString()
  Key: string;

  @IsNotEmpty()
  @IsString()
  UploadId: string;

  @IsNotEmpty()
  @IsNumber()
  PartNumber: number;
}

export class MultipartUploadSignUrlDTO {
  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => SignMultipartUploadParams)
  params: SignMultipartUploadParams;
}

class CompleteMultipartUploadParams {
  @IsNotEmpty()
  @IsString()
  Key: string;

  @IsNotEmpty()
  @IsString()
  UploadId: string;

  @IsNotEmpty()
  MultipartUpload: CompletedMultipartUpload;
}

class CompleteMultipartUploadFile {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  type: string;

  @IsNotEmpty()
  @IsNumber()
  size: number;
}

export class CompleteMultipartUploadDTO {
  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => CompleteMultipartUploadParams)
  params: CompleteMultipartUploadParams;

  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => CompleteMultipartUploadFile)
  file: CompleteMultipartUploadFile;

  // Ignored: taken from the caller's token.
  @IsOptional()
  @IsString()
  appId?: string;

  // Ignored: taken from the caller's token.
  @IsOptional()
  @IsString()
  authorId?: string;

  @IsNotEmpty()
  @IsString()
  attachmentId: string;

  @IsNotEmpty()
  @IsString()
  attachmentName: string;

  @IsNotEmpty()
  @IsNumber()
  duration: number;
}
