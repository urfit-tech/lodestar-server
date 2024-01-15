import { Injectable } from '@nestjs/common';
import { StorageService } from '~/utility/storage/storage.service';
import { UtilityService } from '~/utility/utility.service';
import { createCipheriv, randomBytes, scrypt } from 'crypto';
import { Request } from 'express';
import { Readable } from 'node:stream';

@Injectable()
export class EbookService {
  constructor(private readonly storageService: StorageService, private readonly utilityService: UtilityService) {}

  async getEbookFile(appId: string, programContentId: string) {
    const key = `ebook/${appId}/${programContentId}`;
    const response = await this.storageService.getFileFromBucketStorage({ Key: key });
    return response.Body;
  }

  async encryptEbook(request: Request, fileStream: Readable, appId: string): Promise<Readable> {
    const authorizationHeader = request.headers.authorization;
    let hashKey: string;
    if (!authorizationHeader) {
      return undefined;
    }

    const [type, token] = authorizationHeader.split(' ');
    if (type === 'Bearer' && token) {
      const parts = token.split('.');
      if (parts.length === 3) {
        hashKey = parts[2];
      }
    }

    return this.utilityService.encryptDataStream(fileStream, hashKey, appId);
  }
}
