import { Test, TestingModule } from '@nestjs/testing';
import { EbookService } from './ebook.service';
import { StorageService } from '~/utility/storage/storage.service';
import { UtilityService } from '~/utility/utility.service';
import { Request } from 'express';
import { Readable, Transform } from 'stream';
import { readFileSync } from 'fs';
import { EbookEncryptionError, EbookFileRetrievalError, KeyAndIVRetrievalError } from './ebook.errors';

describe('EbookService', () => {
  let service: EbookService;
  let storageService: StorageService;
  let utilityService: UtilityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EbookService,
        {
          provide: StorageService,
          useValue: {
            getFileFromBucketStorage: jest.fn(),
            deleteFileAtBucketStorage: jest.fn(),
          },
        },
        {
          provide: UtilityService,
          useValue: {
            encryptDataStream: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EbookService>(EbookService);
    storageService = module.get<StorageService>(StorageService);
    utilityService = module.get<UtilityService>(UtilityService);
  });

  describe('getEbookFile', () => {
    it('should call storage service and return the file', async () => {
      const mockFile = new Readable();
      storageService.getFileFromBucketStorage = jest.fn().mockResolvedValue({ Body: mockFile });

      const result = await service.getEbookFile('appId', 'programContentId');
      expect(storageService.getFileFromBucketStorage).toHaveBeenCalledWith({ Key: 'ebook/appId/programContentId' });
      expect(result).toBe(mockFile);
    });

    it('should throw EbookFileRetrievalError when storage service fails', async () => {
      storageService.getFileFromBucketStorage = jest
        .fn()
        .mockRejectedValue(new EbookFileRetrievalError('Storage error'));

      await expect(service.getEbookFile('appId', 'programContentId')).rejects.toThrow(EbookFileRetrievalError);
    });
  });

  describe('encryptEbook', () => {
    it('should call utility service to encrypt data stream', async () => {
      const fileStream = new Readable();
      const encryptedStream = new Readable();
      utilityService.encryptDataStream = jest.fn().mockResolvedValue(encryptedStream);

      const result = await service.encryptEbook(fileStream, 'key', 'iv');
      expect(utilityService.encryptDataStream).toHaveBeenCalledWith(fileStream, 'key', 'iv');
      expect(result).toBe(encryptedStream);
    });

    it('should throw EbookEncryptionError when encryption fails', async () => {
      const fileStream = new Readable();
      utilityService.encryptDataStream = jest.fn().mockRejectedValue(new EbookEncryptionError('Encryption error'));

      await expect(service.encryptEbook(fileStream, 'key', 'iv')).rejects.toThrow(EbookEncryptionError);
    });
  });

  describe('getStandardKeyAndIV', () => {
    it('should return key and IV based on the token and appId', async () => {
      const request = { headers: { authorization: 'Bearer token.part2.signature' } } as Request;

      const result = await service.getStandardKeyAndIV(request, 'appId');
      expect(result).toEqual({ key: 'signature', iv: 'appId' });
    });

    it('should throw KeyAndIVRetrievalError if token format is incorrect', async () => {
      const request = { headers: { authorization: 'Bearer incorrect_token_format' } } as Request;

      await expect(service.getStandardKeyAndIV(request, 'appId')).rejects.toThrow(KeyAndIVRetrievalError);
    });

    it('should return undefined if no authorization header is present', async () => {
      const request = { headers: {} } as Request;

      const result = await service.getStandardKeyAndIV(request, 'appId');
      expect(result).toBeUndefined();
    });
  });

  describe('getTrialKeyAndIV', () => {
    it('should return trial key and IV', async () => {
      const request = { headers: {} } as Request;

      const result = await service.getTrialKeyAndIV(request, 'appId');
      expect(result).toEqual({ key: `trial_key_${process.env.ENCRYPT_DATA_STREAM_SALT}`, iv: 'appId' });
    });
  });
});
