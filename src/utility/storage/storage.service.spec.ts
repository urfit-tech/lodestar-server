import { ConfigService } from '@nestjs/config';
import { S3Client, CompleteMultipartUploadCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { StorageService } from './storage.service';

const REGION = 'us-east-1';
const BUCKET = 'test-bucket';

function makeService(): StorageService {
  const configService = {
    getOrThrow: (key: string) => (key === 'AWS_S3_REGION_STORAGE' ? REGION : BUCKET),
  } as unknown as ConfigService;
  return new StorageService(configService);
}

function noSuchUploadError(): Error {
  const err = new Error(
    'The specified upload does not exist. The upload ID may be invalid, or the upload may have been aborted or completed.',
  );
  err.name = 'NoSuchUpload';
  return err;
}

function notFoundError(): Error {
  const err = new Error('Not Found');
  err.name = 'NotFound';
  return err;
}

describe('StorageService.completeMultipartUpload (idempotency)', () => {
  let service: StorageService;

  beforeEach(() => {
    service = makeService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('treats an already-completed upload as success instead of throwing', async () => {
    // S3 deletes the UploadId after a successful complete, so a retried
    // complete throws NoSuchUpload even though the object is already there.
    jest.spyOn(S3Client.prototype, 'send').mockImplementation((command: any) => {
      if (command instanceof CompleteMultipartUploadCommand) {
        return Promise.reject(noSuchUploadError());
      }
      if (command instanceof HeadObjectCommand) {
        return Promise.resolve({ ContentLength: 123 }); // object exists
      }
      return Promise.reject(new Error('unexpected command'));
    });

    const result = await service.completeMultipartUpload('vod/app/key', 'dead-upload-id', {
      Parts: [{ PartNumber: 1, ETag: 'abc' }],
    });

    expect(result.Location).toContain('vod/app/key');
  });

  it('rethrows NoSuchUpload when the object does not actually exist', async () => {
    jest.spyOn(S3Client.prototype, 'send').mockImplementation((command: any) => {
      if (command instanceof CompleteMultipartUploadCommand) {
        return Promise.reject(noSuchUploadError());
      }
      if (command instanceof HeadObjectCommand) {
        return Promise.reject(notFoundError()); // object missing
      }
      return Promise.reject(new Error('unexpected command'));
    });

    await expect(
      service.completeMultipartUpload('vod/app/key', 'dead-upload-id', {
        Parts: [{ PartNumber: 1, ETag: 'abc' }],
      }),
    ).rejects.toThrow('The specified upload does not exist');
  });
});
