import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';

import { StorageService } from './storage.service';
import {
  CompleteMultipartUploadDTO,
  CreateMultipartUploadDTO,
  MultipartUploadSignUrlDTO,
  UploadDTO,
} from './storage.dto';
import { MediaService } from '~/media/media.service';
import { ConfigService } from '@nestjs/config';
import { Attachment } from '~/media/attachment.entity';
import { AuthGuard } from '~/auth/auth.guard';

@Controller({
  path: 'storage',
  version: ['1', '2'],
})
@UseGuards(AuthGuard)
export class StorageController {
  private readonly awsS3BucketStorage: string;

  constructor(
    private readonly configService: ConfigService<{
      AWS_S3_BUCKET_STORAGE: string;
      AWS_STORAGE_CLOUDFRONT_URL: string;
    }>,
    private readonly storageService: StorageService,
    private readonly mediaService: MediaService,
  ) {
    this.awsS3BucketStorage = configService.getOrThrow('AWS_S3_BUCKET_STORAGE');
  }

  @Post('storage/upload')
  uploadFileToStorageBucket(@Body() body: UploadDTO) {
    const { appId, fileName, prefix } = body;
    return this.storageService.getSignedUrlForUploadStorage(appId, fileName, prefix, 60);
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
      file: { name: fileName, type, size },
      appId,
      authorId,
      attachmentId,
      attachmentName,
      duration,
    } = body;
    const status = 'QUEUED';
    const attachment = new Attachment();
    attachment.appId = appId;
    attachment.authorId = authorId;
    attachment.name = attachmentName;
    attachment.filename = fileName;
    attachment.size = size;
    attachment.contentType = type;
    attachment.status = status;
    attachment.duration = duration;
    attachment.id = attachmentId;
    await this.mediaService.upsertMediaVideoAttachment(attachment, this.awsS3BucketStorage, Key);
    const result = await this.storageService.completeMultipartUpload(Key, UploadId, MultipartUpload);
    return { location: result.Location };
  }
}
