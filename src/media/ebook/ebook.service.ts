import { Injectable } from '@nestjs/common';
import { StorageService } from '~/utility/storage/storage.service';

@Injectable()
export class EbookService {
  constructor(private readonly storageService: StorageService) {}

  async getEbookFileSignedUrl(appId: string, programContentId: string) {
    const key = `ebook/${appId}/${programContentId}`;
    return await this.storageService.getSignedUrlForDownloadStorage(key, 6400);
  }
}
