import { Test, TestingModule } from '@nestjs/testing';
import { VideoService } from './video.service';
import { StorageService } from '~/utility/storage/storage.service';
import { ConfigService } from '@nestjs/config';
import { MediaInfrastructure } from '../media.infra';
import { AuthService } from '~/auth/auth.service';
import { ProgramService } from '~/program/program.service';
import { UtilityService } from '~/utility/utility.service';
import { EntityManager } from 'typeorm/entity-manager/EntityManager';

describe('VideoService', () => {
  let service: VideoService;

  const mockConfigValues = {
    CF_STREAMING_KEY_ID: 'your-cf-streaming-key-id',
    CF_STREAMING_JWK: 'your-cf-streaming-jwk',
    AWS_S3_BUCKET_STORAGE: 'your-aws-s3-bucket-storage',
    AWS_STORAGE_CLOUDFRONT_URL: 'https://your-aws-storage-cloudfront-url',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideoService,
        StorageService,
        {
          provide: ConfigService,
          useValue: { getOrThrow: jest.fn(key => mockConfigValues[key]), get: jest.fn(key => mockConfigValues[key]) },
        },
        { provide: MediaInfrastructure, useValue: {} },
        { provide: AuthService, useValue: {} },
        { provide: ProgramService, useValue: {} },
        { provide: UtilityService, useValue: {} },
        { provide: EntityManager, useValue: {} },
      ],
    }).compile();

    service = module.get<VideoService>(VideoService);
  });

  afterEach(() => jest.resetAllMocks());

  describe('#parseManifestWithSignUrl', () => {
    // single-domain policy: segments are emitted as bare names (resolved by the
    // player against the manifest URL) so playback stays on the site's domain
    it('emits bare segment names with the signature appended', async () => {
      const data = {
        manifest: '1080_01079.ts',
        key: 'vod/demo/a6/a63aa47f-4b8d-4364-a6e3-870a321b8758/output/hls/20240112155033_jvz-rxny-niu (2024-01-09 20_11 GMT+8)_1080/1080.m3u8 Expires=1705912183&Policy=test',
        signature: 'signature=test_signature',
      };

      const signedManifest = await service.parseManifestWithSignUrl(data.manifest, data.key, data.signature);

      expect(signedManifest).toBe(`1080_01079.ts?${data.signature}`);
    });
  });
});
