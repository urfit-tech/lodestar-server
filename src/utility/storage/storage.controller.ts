import { Body, Controller, Post } from '@nestjs/common';

import { StorageService } from './storage.service';
import { UploadDTO } from './storage.dto';

@Controller({
  path: 'storage',
  version: ['2'],
})
export class StorageController {
  constructor(
    private readonly storageService: StorageService,
  ) {}

  @Post('storage/upload')
  uploadFileToStorageBucket(
    @Body() body: UploadDTO,
  ) {
    const { appId, fileName } = body;
    return this.storageService.getSignedUrlForUploadStorage(appId, fileName, 60);
  }
}
