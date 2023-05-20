import { subtle } from 'crypto';
import { EntityManager } from 'typeorm';
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config';
import { InjectEntityManager } from '@nestjs/typeorm';

import { APIException } from '~/api.excetion';
import { UtilityService } from '~/utility/utility.service';

import { MediaInfrastructure } from '../media.infra';
import { CfVideoStreamOptions } from './video.type';

@Injectable()
export class VideoService {
  private cfStreamingKeyId: string;
  private cfStreamingJwk: string;
  
  constructor(
    private readonly configService: ConfigService<{
      CF_STREAMING_KEY_ID: string;
      CF_STREAMING_JWK: string;
    }>,
    private readonly mediaInfra: MediaInfrastructure,
    private readonly utilityService: UtilityService,
    @InjectEntityManager('phdb') private readonly entityManager: EntityManager,
  ) {
    this.cfStreamingKeyId = configService.getOrThrow('CF_STREAMING_KEY_ID');
    this.cfStreamingJwk = configService.getOrThrow('CF_STREAMING_JWK');
  }

  async getCfOptions(id: string): Promise<CfVideoStreamOptions | null> {
    try {
      const attachment = await this.mediaInfra.getById(id, this.entityManager);
      return attachment.options.cloudflare as CfVideoStreamOptions
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async generateCfVideoToken(videoId: string) {
    const cfOptions = await this.getCfOptions(videoId);
    if (cfOptions === null) {
      throw new APIException({
        code: 'E_ATTACHMENT',
        message: `cannot get the attachment: no cloudflare options or no suck attachment`,
      });
    }

    const { uid: cfUid } = cfOptions;
    const encoder = new TextEncoder();
    const expiresIn = Math.floor(Date.now() / 1000) + 3600
    const headers = {
      'alg': 'RS256',
      'kid': this.cfStreamingKeyId,
    };
    const data = {
      'sub': cfUid,
      'kid': this.cfStreamingKeyId,
      'exp': expiresIn,
      'accessRules': [{
        'type': 'any',
        'action': 'allow'
      }],
    };

    const token = `${this.utilityService.objectToBase64url(headers)}.${this.utilityService.objectToBase64url(data)}`;

    const jwk = JSON.parse(atob(this.cfStreamingJwk));
    const key = await subtle.importKey(
      'jwk', jwk,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      false, [ 'sign' ],
    );
  
    const signature = await subtle.sign(
      { name: 'RSASSA-PKCS1-v1_5' }, key, encoder.encode(token),
    );
  
    const signedToken = `${token}.${this.utilityService.arrayBufferToBase64Url(signature)}`;
  
    return signedToken;
  }
}
