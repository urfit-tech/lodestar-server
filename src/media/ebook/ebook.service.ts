import { Injectable } from '@nestjs/common';
import { StorageService } from '~/utility/storage/storage.service';

@Injectable()
export class EbookService {
  constructor(private readonly storageService: StorageService) {}

  async getEbookFile(appId: string, programContentId: string) {
    const key = `ebook/${appId}/${programContentId}`;
    const response = await this.storageService.getFileFromBucketStorage({ Key: key });
    return response.Body;
  }
}
