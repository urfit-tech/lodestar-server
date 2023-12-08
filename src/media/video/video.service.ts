import { subtle } from 'crypto';
import { EntityManager } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectEntityManager } from '@nestjs/typeorm';

import { APIException } from '~/api.excetion';
import { ProgramService } from '~/program/program.service';
import { UtilityService } from '~/utility/utility.service';

import { MediaInfrastructure } from '../media.infra';
import { CfVideoStreamOptions } from './video.type';
import { AuthService } from '~/auth/auth.service';
import { Attachment } from '../attachment.entity';
import { StorageService } from '~/utility/storage/storage.service';
import { last, isEmpty } from 'lodash';

@Injectable()
export class VideoService {
  private readonly cfStreamingKeyId: string;
  private readonly cfStreamingJwk: string;
  private readonly awsS3BucketStorage: string;
  private readonly awsStorageCloudFrontUrl: string;
  constructor(
    private readonly configService: ConfigService<{
      CF_STREAMING_KEY_ID: string;
      CF_STREAMING_JWK: string;
      AWS_S3_BUCKET_STORAGE: string;
      AWS_STORAGE_CLOUDFRONT_URL: string;
    }>,
    private readonly mediaInfra: MediaInfrastructure,
    private readonly authService: AuthService,
    private readonly programService: ProgramService,
    private readonly utilityService: UtilityService,
    private readonly storageService: StorageService,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {
    this.cfStreamingKeyId = configService.getOrThrow('CF_STREAMING_KEY_ID');
    this.cfStreamingJwk = configService.getOrThrow('CF_STREAMING_JWK');
    this.awsS3BucketStorage = configService.getOrThrow('AWS_S3_BUCKET_STORAGE');
    this.awsStorageCloudFrontUrl = configService.getOrThrow('AWS_STORAGE_CLOUDFRONT_URL');
  }

  async generateCfVideoToken(videoId: string, authToken?: string) {
    const isAbleToGenerate = await this.isAbleToGenerate(videoId, authToken);
    if (!isAbleToGenerate) {
      throw new APIException({
        code: 'E_SIGN_URL',
        message: `the content is not for trial`,
      });
    }

    const cfOptions = await this.getCfOptions(videoId);
    if (cfOptions === null) {
      throw new APIException({
        code: 'E_ATTACHMENT',
        message: `cannot get the attachment: no cloudflare options or no suck attachment`,
      });
    }
    const { uid: cfUid } = cfOptions;
    const videoToken = await this.generateCfStreamingToken(cfUid);

    return { videoToken, cfOptions };
  }

  /**
   * TODO:
   *  Different ProgramContents may overlap with same Attachment,
   *  DisplayMode conceal, loginToTrail, payToWatch requires login, but not trail.
   *  If ProgramContents contains both login and non-login state would not able to determines return boolean.
   *  Thus, currently if one of ProgramContent contains trail will return true by default.
   */
  private async isAbleToGenerate(videoId: string, authToken?: string): Promise<boolean> {
    const programContents = await this.programService.getProgramContentByAttachmentId(videoId);
    if (programContents.some(({ displayMode }) => displayMode === 'trial')) {
      return true;
    }

    try {
      this.authService.verify(authToken);
    } catch {
      return false;
    }
    return true;
  }

  private async getCfOptions(id: string): Promise<CfVideoStreamOptions | null> {
    try {
      const attachment = await this.mediaInfra.getById(id, this.entityManager);
      return attachment.options.cloudflare as CfVideoStreamOptions;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  private async generateCfStreamingToken(cfUid: string): Promise<string> {
    const encoder = new TextEncoder();
    const expiresIn = Math.floor(Date.now() / 1000) + 3600 * 6;
    const headers = {
      alg: 'RS256',
      kid: this.cfStreamingKeyId,
    };
    const data = {
      sub: cfUid,
      kid: this.cfStreamingKeyId,
      exp: expiresIn,
      accessRules: [
        {
          type: 'any',
          action: 'allow',
        },
      ],
    };

    const token = `${this.utilityService.objectToBase64url(headers)}.${this.utilityService.objectToBase64url(data)}`;

    const jwk = JSON.parse(atob(this.cfStreamingJwk));
    const key = await subtle.importKey(
      'jwk',
      jwk,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      false,
      ['sign'],
    );

    const signature = await subtle.sign({ name: 'RSASSA-PKCS1-v1_5' }, key, encoder.encode(token));

    const signedToken = `${token}.${this.utilityService.arrayBufferToBase64Url(signature)}`;

    return signedToken;
  }

  public async uploadCaption(attachmentId: string, key: string, buffer: Buffer): Promise<Attachment> {
    const existAttachment = await this.mediaInfra.getById(attachmentId, this.entityManager);
    if (existAttachment?.options?.source?.s3?.captions) {
      existAttachment.options.source.s3.captions.push(`s3://${this.awsS3BucketStorage}/${key}`);
      existAttachment.options.source.s3.captions = [...new Set(existAttachment?.options?.source?.s3?.captions)];
    } else {
      existAttachment.options = {
        ...existAttachment?.options,
        source: {
          ...existAttachment?.options?.source,
          s3: { ...existAttachment?.options?.source?.s3, captions: [`s3://${this.awsS3BucketStorage}/${key}`] },
        },
      };
    }
    await this.storageService.saveFileInBucketStorage({ Body: buffer, Key: key });
    return await this.mediaInfra.upsertAttachment(existAttachment, this.entityManager);
  }

  public async getCaptions(attachmentId: string): Promise<any> {
    const existAttachment = await this.mediaInfra.getById(attachmentId, this.entityManager);
    let foldername;
    const keys = [];
    // get caption keys captions for new video upload to S3
    if (!isEmpty(existAttachment?.options?.source?.s3?.captions)) {
      const url = new URL(existAttachment?.options?.source?.s3?.captions[0]);
      foldername = url.pathname.split('/').slice(0, -1).join('/');
    }

    // get caption keys for old cloudfront video migrate to S3
    if (!isEmpty(existAttachment?.options?.cloudfront?.path)) {
      const url = new URL(existAttachment?.options?.cloudfront?.path);
      foldername = url.pathname.split('/').slice(0, -2).join('/') + '/text';
    }

    if (foldername) {
      const list = await this.storageService.listFilesInBucketStorage({
        Prefix: foldername.substring(1),
      });
      if (list['Contents']) {
        for (let index = 0; index < list['Contents'].length; index++) {
          const keyWithCloudfrontHost = `${this.awsStorageCloudFrontUrl}/${list['Contents'][index]['Key']}`;
          keys.push(keyWithCloudfrontHost);
        }
      }
    }

    return keys.filter((key) => key.includes('.vtt') || key.includes('.srt'));
  }
}
