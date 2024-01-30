import { Injectable } from '@nestjs/common';
import { StorageService } from '~/utility/storage/storage.service';
import { UtilityService } from '~/utility/utility.service';
import { createCipheriv, randomBytes, scrypt } from 'crypto';
import { Request } from 'express';
import { Readable } from 'node:stream';
import { APIException } from '~/api.excetion';
import { EbookEncryptionError, EbookFileRetrievalError, KeyAndIVRetrievalError } from './ebook.errors';

@Injectable()
export abstract class EbookService {
  constructor(private readonly storageService: StorageService, private readonly utilityService: UtilityService) {}

  async processEbook(appId: string, programContentId: string, req: Request): Promise<Readable | undefined> {
    let fileStream;
    let key: string;
    let iv: string;

    try {
      fileStream = await this.getEbookFile(appId, programContentId);
    } catch (error) {
      console.error('Error getting ebook file:', error);
      throw new EbookFileRetrievalError("Unable to retrieve ebook file")
    }

    try {
      const keyAndIv = await this.getKeyAndIV(req, appId);
      key = keyAndIv.key;
      iv = keyAndIv.iv;
    } catch (error) {
      console.error('Error getting key and IV:', error);
      throw new KeyAndIVRetrievalError("Unable to retrieve key and IV")
    }

    try {
      const encryptedFileStream = await this.encryptEbook(fileStream as Readable, key, iv);
      return encryptedFileStream;
    } catch (error) {
      console.error('Error encrypting ebook:', error);
      throw new EbookEncryptionError("Error encrypting ebook")
    }
  }

  async getEbookFile(appId: string, programContentId: string)  {
    const key = `ebook/${appId}/${programContentId}`;
    const response = await this.storageService.getFileFromBucketStorage({ Key: key });
    return response.Body;
  }

  async encryptEbook(fileStream: Readable, key: string, iv: string): Promise<Readable | undefined> {

    return this.utilityService.encryptDataStream(fileStream, key, iv);
  }

  abstract getKeyAndIV(request: Request, appId?: string): Promise<{ key: string, iv: string }>;
}

@Injectable()
export class StandardEbookService extends EbookService {
  async getKeyAndIV(request: Request, appId?: string): Promise<{ key: string; iv: string; }> {
    const authorizationHeader = request.headers.authorization;
    let hashKey: string;

    if(!authorizationHeader){
      return undefined
    }

    const [_, token] = authorizationHeader.split(' ');

    const parts = token.split('.');
    if (parts.length === 3) {
      hashKey = parts[2];
    } else {
      throw new KeyAndIVRetrievalError("Unable to retrieve key and IV")
    }

    const iv = appId

    return { key: hashKey, iv: iv };
  }

}

export class TrialEbookService extends EbookService {
  async getKeyAndIV(request: Request, appId?: string): Promise<{ key: string; iv: string; }> {
    console.log("#@##@#@#@@##@#@")
    return { key: `trial_key_${process.env.ENCRYPT_DATA_STREAM_SALT}`, iv: `trial_key_${process.env.ENCRYPT_DATA_STREAM_SALT}`};
  }
}