import { Body, Controller, Post } from '@nestjs/common';

import { StorageService } from './storage.service';
import { UploadDTO } from './storage.dto';
import { CompletedMultipartUpload } from '@aws-sdk/client-s3';

@Controller({
  path: 'storage',
  version: ['2'],
})
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('storage/upload')
  uploadFileToStorageBucket(@Body() body: UploadDTO) {
    const { appId, fileName } = body;
    return this.storageService.getSignedUrlForUploadStorage(appId, fileName, 60);
  }

  @Post('/multipart/create')
  async createMultipartUpload(
    @Body()
    body: {
      params: {
        Key: string;
        ContentType: string;
      };
    },
  ) {
    const { params } = body;
    const { UploadId } = await this.storageService.createMultipartUpload(params);
    return {
      uploadId: UploadId,
    };
  }

  @Post('/multipart/sign-url')
  async getSignedUrl(
    @Body()
    body: {
      params: {
        Key: string;
        UploadId: string;
        PartNumber: number;
      };
    },
  ) {
    const { params } = body;
    const presignedUrl = await this.storageService.getSignedUrlForUploadPartStorage(params, 60);
    return { presignedUrl };
  }

  @Post('/multipart/complete')
  async completeMultipartUpload(
    @Body()
    body: {
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
    },
  ) {
    const { params, file, appId, authorId, attachmentId } = body;
    const result = await this.storageService.completeMultipartUpload(params);
    await this.storageService.insertVideoAttachment(appId, authorId, attachmentId, file);
    return { location: result.Location };
  }
}
