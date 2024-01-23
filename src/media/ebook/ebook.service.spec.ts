import { Test, TestingModule } from '@nestjs/testing';
import { EbookService } from './ebook.service';
import { StorageService } from '~/utility/storage/storage.service';
import { UtilityService } from '~/utility/utility.service';
import { Request } from 'express';
import { Readable, Transform } from 'stream';
import { readFileSync } from 'fs';

describe('EbookService', () => {
  let service: EbookService;
  let storageService: StorageService;
  let utilityService: UtilityService;
  const mockStorageService = {
    getFileFromBucketStorage: jest.fn(),
    deleteFileAtBucketStorage: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EbookService,
        {
          provide: StorageService,
          useValue: {
            getFileFromBucketStorage: jest.fn().mockImplementationOnce(() => {
              const filePath = 'test/ebook/5e50b600-5e1b-4094-bd4e-99e506e5ca98.epub';
              const testDataFile = readFileSync(filePath);
              return Promise.resolve({
                ContentType: 'application/epub+zip',
                Body: {
                  transformToByteArray: () => testDataFile,
                },
                ETag: '"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"',
              });
            }),
          },
        },
        {
          provide: UtilityService,
          useValue: {
            encryptDataStream: jest.fn().mockImplementation(() => {
              const transformStream = new Transform({
                transform(chunk, encoding, callback) {
                  this.push(chunk.toString().toUpperCase());
                  callback();
                },
              });
              return transformStream;
            }),
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
      await service.getEbookFile('appId', 'programContentId');

      expect(storageService.getFileFromBucketStorage).toHaveBeenCalledWith({ Key: 'ebook/appId/programContentId' });
    });
  });

  describe('encryptEbook', () => {
    it('should return undefined if no authorization header is present', async () => {
      const request = { headers: {} } as Request;
      const fileStream = new Readable();

      const result = await service.encryptEbook(request, fileStream, 'appId');

      expect(result).toBeUndefined();
    });

    it('should encrypt data stream if valid authorization token is provided', async () => {
      const request = {
        headers: {
          authorization: Math.random().toString(36).substring(2, 15),
        },
      } as unknown as Request;

      const fileStream = new Readable({
        read() {
          this.push('some data');
          this.push(null);
        },
      });

      jest.spyOn(utilityService, 'encryptDataStream').mockImplementation((dataStream) => {
        const transformStream = new Transform({
          transform(chunk, encoding, callback) {
            this.push(chunk.toString().toUpperCase());
            callback();
          },
        });
        dataStream.pipe(transformStream);
        return transformStream;
      });

      const result = await service.encryptEbook(request, fileStream, 'appId');

      const data = await new Promise((resolve, reject) => {
        let dataString = '';
        result.on('data', (chunk) => (dataString += chunk));
        result.on('end', () => resolve(dataString));
        result.on('error', reject);
      });

      expect(data).toBe('SOME DATA');
    });
  });
});
