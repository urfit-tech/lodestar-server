import { subtle } from 'crypto';
import { EntityManager } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectEntityManager } from '@nestjs/typeorm';

import { APIException } from '~/api.excetion';
import { ProgramService } from '~/program/program.service';
import { UtilityService } from '~/utility/utility.service';

import { MediaInfrastructure } from '../media.infra';
import { CfVideoStreamOptions, CloudfrontVideoOptions } from './video.type';
import { AuthService } from '~/auth/auth.service';
import { StorageService } from '~/utility/storage/storage.service';
import { getSignedUrl } from 'aws-cloudfront-sign';

@Injectable()
export class VideoService {
  private readonly cfStreamingKeyId: string;
  private readonly cfStreamingJwk: string;
  private readonly awsS3BucketStorage: string;
  private readonly awsStorageCloudFrontUrl: string;
  private readonly awsCloudfrontKeyPairId: string;
  private readonly awsCloudfrontPrivateKey: string;
  constructor(
    private readonly configService: ConfigService<{
      CF_STREAMING_KEY_ID: string;
      CF_STREAMING_JWK: string;
      AWS_S3_BUCKET_STORAGE: string;
      AWS_STORAGE_CLOUDFRONT_URL: string;
      AWS_CLOUDFRONT_KEY_PAIR_ID: string;
      AWS_CLOUDFRONT_PRIVATE_KEY: string;
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
    this.awsCloudfrontKeyPairId = configService.getOrThrow('AWS_CLOUDFRONT_KEY_PAIR_ID');
    this.awsCloudfrontPrivateKey = configService.getOrThrow('AWS_CLOUDFRONT_PRIVATE_KEY');
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
        message: `cannot get the attachment: no cloudflare options or no attachment`,
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

  public async uploadCaption(attachmentId: string, key: string, buffer: Buffer): Promise<string> {
    const attachment = await this.mediaInfra.getById(attachmentId, this.entityManager);
    if (attachment) {
      await this.storageService.saveFileInBucketStorage({ Body: buffer, Key: key });
    } else {
      throw new APIException({
        code: 'E_ATTACHMENT',
        message: `cannot get the attachment`,
      });
    }
    return key;
  }

  private isVideoSourceFromMediaConvert(videoOptions: any): boolean {
    const isCreatedByMediaConvert = videoOptions?.cloudfront?.playPaths?.hls ? true : false;
    return isCreatedByMediaConvert;
  }

  public async getCaptions(attachmentId: string): Promise<Array<string>> {
    const attachment = await this.mediaInfra.getById(attachmentId, this.entityManager);
    if (!attachment) {
      throw new APIException({
        code: 'E_ATTACHMENT',
        message: `cannot get the attachment`,
      });
    }
    const { options } = attachment;
    const captionKeys = [];
    const isCreatedByMediaConvert = this.isVideoSourceFromMediaConvert(options);
    const pathname = isCreatedByMediaConvert
      ? new URL(options?.cloudfront?.playPaths?.hls).pathname
      : new URL(options?.cloudfront?.path).pathname;
    const prefix = isCreatedByMediaConvert
      ? pathname.split('/').slice(0, -3).join('/') + '/captions'
      : pathname.split('/').slice(0, -2).join('/') + '/text';

    const list = await this.storageService.listFilesInBucketStorage({
      Prefix: prefix.substring(1),
    });
    if (list?.Contents) {
      for (let index = 0; index < list.Contents.length; index++) {
        const keyWithCloudfrontHost = `${this.awsStorageCloudFrontUrl}/${list.Contents[index].Key}`;
        captionKeys.push(keyWithCloudfrontHost);
      }
    }

    const result = captionKeys
      .filter((key) => key.includes('.vtt'))
      .sort((a, b) => {
        if (a.includes('zh.vtt')) {
          return -1;
        } else if (b.includes('zh.vtt')) {
          return 1;
        } else {
          return 0;
        }
      });
    return result;
  }

  public async deleteCaptions(attachmentId: string, filename: string): Promise<Array<string>> {
    const keys = await this.getCaptions(attachmentId);

    const keysNeedToDelete = keys.filter((key) => key.includes(filename));
    for (const key of keysNeedToDelete) {
      await this.storageService.deleteFileAtBucketStorage({ Key: new URL(key).pathname.substring(1) });
    }
    return keys;
  }

  public async parseManifestWithSignUrl(manifest: string, key: string, signature: string): Promise<string> {
    const host = this.awsStorageCloudFrontUrl;
    const keyArray = key.split('/');
    keyArray.pop();
    const path = keyArray.join('/');
    const res = manifest.split('\n');
    const signedManifest = res
      .filter((row) => !row.includes('#EXT-X-MEDIA:TYPE=SUBTITLES')) // remove caption in m3u8, we will get vtt in frontend
      .map((row) => {
        if (row.includes('.m3u8')) {
          if (row.includes('URI=')) {
            return `${row.split('?')[0].split('.m3u8')[0]}.m3u8?${signature}"`;
          }
          return `${row.split('?')[0].split('.m3u8')[0]}.m3u8?${signature}`;
        } else if (row.includes('.mp4')) {
          // for mpd
          return `${host}/${path}/${row.split('?')[0]}?${signature}`;
        } else if (row.includes('.ts') || row.includes('.vtt')) {
          return `${host}/${path}/${row.split('?')[0]}?${signature}`;
        } else {
          return row;
        }
      })
      .map((row) => row.replace(',SUBTITLES="group_subtitle"', ''))
      .join('\n');
    return signedManifest;
  }

  private async getCloudfrontOptions(id: string): Promise<CloudfrontVideoOptions | null> {
    try {
      const attachment = await this.mediaInfra.getById(id, this.entityManager);
      return attachment.options.cloudfront as CloudfrontVideoOptions;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  public async generateCloudfrontSignedUrl(videoId: string, authToken?: string) {
    const isAbleToGenerate = await this.isAbleToGenerate(videoId, authToken);
    if (!isAbleToGenerate) {
      throw new APIException({
        code: 'E_SIGN_URL',
        message: `the content is not for trial`,
      });
    }

    const cloudfrontOptions = await this.getCloudfrontOptions(videoId);
    if (cloudfrontOptions === null) {
      throw new APIException({
        code: 'E_ATTACHMENT',
        message: `cannot get the attachment: no cloudfront options or no attachment`,
      });
    }
    const { path, playPaths } = cloudfrontOptions;
    if (!path && !playPaths) {
      throw new APIException({
        code: 'E_ATTACHMENT',
        message: `cannot get the attachment: no path in cloudfront option`,
      });
    }

    const videoUrl = playPaths?.hls ? `${playPaths.hls.split('hls')[0]}*` : `${path.split('manifest')[0]}*`;
    const captionUrl = playPaths?.hls
      ? `${playPaths.hls.split('output')[0]}captions/*`
      : `${path.split('manifest')[0]}*`;
    const videoUrlSignature = this.signCloudfrontUrl(videoUrl);
    const captionUrlSignature = this.signCloudfrontUrl(captionUrl);
    const captionPaths = await this.getCaptions(videoId);
    const captionSignedUrls = captionPaths.map((captionUrl) => `${new URL(captionUrl)}${captionUrlSignature}`);

    const hlsPath = cloudfrontOptions?.playPaths
      ? `${new URL(cloudfrontOptions.playPaths.hls).pathname}${videoUrlSignature}`
      : null;
    const dashPath = cloudfrontOptions?.playPaths
      ? `${new URL(cloudfrontOptions.playPaths.dash).pathname}${videoUrlSignature}`
      : null;
    const cloudfrontMigratedHlsPath = cloudfrontOptions?.path
      ? `${new URL(cloudfrontOptions.path).pathname}${videoUrlSignature}`
      : null;

    return {
      videoSignedPaths: {
        hlsPath,
        dashPath,
        cloudfrontMigratedHlsPath,
      },
      captionSignedUrls,
    };
  }

  private signCloudfrontUrl(url: string): string {
    const options = {
      keypairId: this.awsCloudfrontKeyPairId,
      privateKeyString: this.awsCloudfrontPrivateKey,
      expireTime: new Date().getTime() + 6400000,
    };
    const signedUrl = getSignedUrl(url, options);
    const signature = new URL(signedUrl).search;
    return signature;
  }
}
