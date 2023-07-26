import { CompletedMultipartUpload } from '@aws-sdk/client-s3';
import { IsString } from 'class-validator';

export class UploadDTO {
  @IsString()
  appId: string;

  @IsString()
  fileName: string;
}

export interface CreateMultipartUploadDTO {
  Key: string;
  ContentType: string;
}
export interface CompleteMultipartUploadDTO {
  params: {
    Key: string;
    UploadId: string;
    MultipartUpload: CompletedMultipartUpload;
  };
  file: {
    name: string;
    type: string;
    size: number;
  };
  appId: string;
  authorId: string;
  attachmentId: string;
}
export interface MultipartUploadSignUrlDTO {
  params: {
    Key: string;
    UploadId: string;
    PartNumber: number;
  };
}
