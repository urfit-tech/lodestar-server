import { StorageController } from './storage.controller';
import { isStorageKeyInApp } from './storage.access';

describe('isStorageKeyInApp', () => {
  it('accepts the admin uploader layout for the caller app', () => {
    expect(isStorageKeyInApp('vod/appA/ab/abcd-1234/video/20261116120000_abcd-1234', 'appA')).toBe(true);
  });

  it.each([
    ['another app', 'vod/appB/ab/abcd/video/file', 'appA'],
    ['app id as a later segment only', 'vod/appB/appA/file', 'appA'],
    ['app id prefix match', 'vod/appAB/ab/file', 'appA'],
    ['no file part', 'vod/appA/', 'appA'],
    ['too short', 'vod/appA', 'appA'],
    ['leading slash', '/appA/x/file', 'appA'],
    ['dot-dot segment', 'vod/appA/../appB/file', 'appA'],
    ['dot segment', 'vod/appA/./file', 'appA'],
    ['missing token app', 'vod/appA/file', undefined],
    ['non-string key', 123, 'appA'],
  ])('rejects %s', (_label, key, appId) => {
    expect(isStorageKeyInApp(key, appId as string)).toBe(false);
  });
});

describe('StorageController multipart endpoints', () => {
  let storageService: {
    createMultipartUpload: jest.Mock;
    getSignedUrlForUploadPartStorage: jest.Mock;
    completeMultipartUpload: jest.Mock;
  };
  let mediaService: { upsertMediaVideoAttachment: jest.Mock };
  let controller: StorageController;
  const member = {
    appId: 'appA',
    memberId: 'admin1',
    role: 'general-member',
    permissions: ['MEDIA_LIBRARY_ADMIN'],
  } as any;
  const ownKey = 'vod/appA/ab/abcd/video/20261116_abcd';
  const otherKey = 'vod/appB/ab/abcd/video/20261116_abcd';

  beforeEach(() => {
    storageService = {
      createMultipartUpload: jest.fn().mockResolvedValue({ UploadId: 'upload1' }),
      getSignedUrlForUploadPartStorage: jest.fn().mockResolvedValue('https://s3/part'),
      completeMultipartUpload: jest.fn().mockResolvedValue({ Location: 'https://s3/object' }),
    };
    mediaService = { upsertMediaVideoAttachment: jest.fn().mockResolvedValue(undefined) };
    const configService = { getOrThrow: jest.fn().mockReturnValue('bucket') };
    controller = new StorageController(configService as any, storageService as any, mediaService as any);
  });

  it('creates and signs uploads for keys under the caller app', async () => {
    await expect(
      controller.createMultipartUpload({ params: { Key: ownKey, ContentType: 'video/mp4' } }, member),
    ).resolves.toEqual({ uploadId: 'upload1' });
    await expect(
      controller.getSignedUrl({ params: { Key: ownKey, UploadId: 'upload1', PartNumber: 1 } }, member),
    ).resolves.toEqual({ presignedUrl: 'https://s3/part' });
  });

  it('refuses create / sign-url for another app key', async () => {
    await expect(
      controller.createMultipartUpload({ params: { Key: otherKey, ContentType: 'video/mp4' } }, member),
    ).rejects.toMatchObject({ code: 'E_STORAGE_KEY_FORBIDDEN' });
    await expect(
      controller.getSignedUrl({ params: { Key: otherKey, UploadId: 'upload1', PartNumber: 1 } }, member),
    ).rejects.toMatchObject({ code: 'E_STORAGE_KEY_FORBIDDEN' });
    expect(storageService.createMultipartUpload).not.toHaveBeenCalled();
    expect(storageService.getSignedUrlForUploadPartStorage).not.toHaveBeenCalled();
  });

  const completeBody = (Key: string) =>
    ({
      params: { Key, UploadId: 'upload1', MultipartUpload: { Parts: [] } },
      file: { name: 'lesson.mp4', type: 'video/mp4', size: 10 },
      appId: 'appB',
      authorId: 'someoneElse',
      attachmentId: 'abcd',
      attachmentName: 'Lesson',
      duration: 60,
    } as any);

  it('completes with appId and authorId from the token, not the body', async () => {
    await expect(controller.completeMultipartUpload(completeBody(ownKey), member)).resolves.toEqual({
      location: 'https://s3/object',
    });
    const [attachment, bucket, key] = mediaService.upsertMediaVideoAttachment.mock.calls[0];
    expect(attachment).toMatchObject({ id: 'abcd', appId: 'appA', authorId: 'admin1', status: 'QUEUED' });
    expect(bucket).toBe('bucket');
    expect(key).toBe(ownKey);
  });

  it('refuses to complete another app key without touching the attachment or S3', async () => {
    await expect(controller.completeMultipartUpload(completeBody(otherKey), member)).rejects.toMatchObject({
      code: 'E_STORAGE_KEY_FORBIDDEN',
    });
    expect(mediaService.upsertMediaVideoAttachment).not.toHaveBeenCalled();
    expect(storageService.completeMultipartUpload).not.toHaveBeenCalled();
  });

  it('does not complete the S3 upload when the attachment belongs to another app', async () => {
    mediaService.upsertMediaVideoAttachment.mockRejectedValue(
      Object.assign(new Error('E_ATTACHMENT_FORBIDDEN'), { code: 'E_ATTACHMENT_FORBIDDEN' }),
    );
    await expect(controller.completeMultipartUpload(completeBody(ownKey), member)).rejects.toMatchObject({
      code: 'E_ATTACHMENT_FORBIDDEN',
    });
    expect(storageService.completeMultipartUpload).not.toHaveBeenCalled();
  });
});
