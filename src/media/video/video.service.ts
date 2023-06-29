import { subtle } from 'crypto';
import { EntityManager } from 'typeorm';
import jwt from 'jsonwebtoken';
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config';
import { InjectEntityManager } from '@nestjs/typeorm';

import { APIException } from '~/api.excetion';
import { ProgramService } from '~/program/program.service';
import { UtilityService } from '~/utility/utility.service';

import { MediaInfrastructure } from '../media.infra';
import { CfVideoStreamOptions } from './video.type';

@Injectable()
export class VideoService {
  private readonly cfStreamingKeyId: string;
  private readonly cfStreamingJwk: string;
  private readonly hasuraJwtSecret: string;
  
  constructor(
    private readonly configService: ConfigService<{
      CF_STREAMING_KEY_ID: string;
      CF_STREAMING_JWK: string;
      HASURA_JWT_SECRET: string;
    }>,
    private readonly mediaInfra: MediaInfrastructure,
    private readonly programService: ProgramService,
    private readonly utilityService: UtilityService,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {
    this.cfStreamingKeyId = configService.getOrThrow('CF_STREAMING_KEY_ID');
    this.cfStreamingJwk = configService.getOrThrow('CF_STREAMING_JWK');
    this.hasuraJwtSecret = configService.getOrThrow('HASURA_JWT_SECRET');
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

    let jwtToken: string;
    try {
      jwtToken = jwt.verify(authToken, this.hasuraJwtSecret) as string;
    } catch {
      return false;
    }
    return true;
  }

  private async getCfOptions(id: string): Promise<CfVideoStreamOptions | null> {
    try {
      const attachment = await this.mediaInfra.getById(id, this.entityManager);
      return attachment.options.cloudflare as CfVideoStreamOptions
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  private async generateCfStreamingToken(cfUid: string): Promise<string> {
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
