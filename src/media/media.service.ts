import { getSignedCookies } from '@aws-sdk/cloudfront-signer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectEntityManager } from '@nestjs/typeorm';
import dayjs from 'dayjs';
import { EntityManager } from 'typeorm';
import { MediaInfrastructure } from './media.infra';

@Injectable()
export class MediaService {
  private readonly awsCloudfrontKeyPairId: string;
  private readonly awsCloudfrontPrivateKey: string;

  constructor(
    @InjectEntityManager() private readonly entityManager: EntityManager,
    private readonly mediaInfra: MediaInfrastructure,
    private readonly configService: ConfigService<{
      AWS_CLOUDFRONT_KEY_PAIR_ID: string;
      AWS_CLOUDFRONT_PRIVATE_KEY: string;
    }>,
  ) {
    this.awsCloudfrontKeyPairId = configService.getOrThrow('AWS_CLOUDFRONT_KEY_PAIR_ID');
    this.awsCloudfrontPrivateKey = configService.getOrThrow('AWS_CLOUDFRONT_PRIVATE_KEY');
  }

  async insertAttachment(
    appId: string,
    authorId: string,
    attachmentId: string,
    name: string,
    type: string,
    size: number,
    options: any,
  ) {
    return await this.mediaInfra.insertAttachment(
      this.entityManager,
      appId,
      authorId,
      attachmentId,
      name,
      type,
      size,
      options,
    );
  }

  signCookies(url: string) {
    const cookies = getSignedCookies({
      url,
      keyPairId: this.awsCloudfrontKeyPairId,
      dateLessThan: dayjs().add(1, 'day').format('YYYY-MM-DD'),
      privateKey: this.awsCloudfrontPrivateKey,
    });
    return cookies;
  }
}
