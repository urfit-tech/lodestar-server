import { Body, Controller, Get, Post, Query, Req, Res } from '@nestjs/common';

import { StorageService } from './storage.service';
import {
  CompleteMultipartUploadDTO,
  CreateMultipartUploadDTO,
  MultipartUploadSignUrlDTO,
  UploadDTO,
} from './storage.dto';
import { MediaService } from '~/media/media.service';
import { ConfigService } from '@nestjs/config';

@Controller({
  path: 'storage',
  version: ['2'],
})
export class StorageController {
  private readonly awsS3BucketStorage: string;
  constructor(
    private readonly configService: ConfigService<{
      AWS_S3_BUCKET_STORAGE: string;
    }>,
    private readonly storageService: StorageService,
    private readonly mediaService: MediaService,
  ) {
    this.awsS3BucketStorage = configService.getOrThrow('AWS_S3_BUCKET_STORAGE');
  }

  @Post('storage/upload')
  uploadFileToStorageBucket(@Body() body: UploadDTO) {
    const { appId, fileName } = body;
    return this.storageService.getSignedUrlForUploadStorage(appId, fileName, 60);
  }

  @Post('/multipart/create')
  async createMultipartUpload(
    @Body()
    body: CreateMultipartUploadDTO,
  ) {
    const { Key, ContentType } = body.params;
    const { UploadId: uploadId } = await this.storageService.createMultipartUpload(Key, ContentType);
    return {
      uploadId,
    };
  }

  @Post('/multipart/sign-url')
  async getSignedUrl(
    @Body()
    body: MultipartUploadSignUrlDTO,
  ) {
    const {
      params: { Key, UploadId, PartNumber },
    } = body;
    const presignedUrl = await this.storageService.getSignedUrlForUploadPartStorage(Key, UploadId, PartNumber, 60);
    return { presignedUrl };
  }

  @Post('/multipart/complete')
  async completeMultipartUpload(
    @Body()
    body: CompleteMultipartUploadDTO,
  ) {
    const {
      params: { Key, UploadId, MultipartUpload },
      file: { name, type, size },
      appId,
      authorId,
      attachmentId,
    } = body;
    const status = 'QUEUED';
    await this.mediaService.insertAttachment(appId, authorId, attachmentId, name, type, size, status, {
      source: { s3: `s3://${this.awsS3BucketStorage}/${Key}` },
    });
    const result = await this.storageService.completeMultipartUpload(Key, UploadId, MultipartUpload);
    return { location: result.Location };
  }

  @Get('*.m3u8')
  async getM3u8WithSignUrl(@Req() request: Request) {
    const [key, signature] = decodeURI(request.url).split('storage/')[1].split('?');
    const output = await this.storageService.getFileFromBucketStorage({
      Key: key,
    });
    const host = 'https://media-dev.kolable.com';
    const path = key.split('/');
    path.pop();
    const final = path.join('/');
    const res = (await output.Body.transformToString()).split('\n');
    const signedRes = res
      .map((row) => {
        if (row.includes('.m3u8')) {
          if (row.includes('URI=')) {
            return `${row.split('?')[0].split('.m3u8')[0]}.m3u8?${signature}"`;
          }
          return `${row.split('?')[0].split('.m3u8')[0]}.m3u8?${signature}`;
        } else if (row.includes('.mpd')) {
          return `${row.split('?')[0]}?${signature}`;
        } else if (row.includes('.ts') || row.includes('.vtt')) {
          return `${host}/${final}/${row.split('?')[0]}?${signature}`;
        } else {
          return row;
        }
      })
      .join('\n');

    console.log(signedRes);
    return signedRes;
  }
}
