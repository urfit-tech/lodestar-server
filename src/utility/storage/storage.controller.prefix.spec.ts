import { StorageController } from './storage.controller';

describe('StorageController storage/upload and storage/download prefixes', () => {
  let storageService: {
    getSignedUrlForUploadStorage: jest.Mock;
    getSignedUrlForDownloadStorage: jest.Mock;
    createMultipartUpload: jest.Mock;
  };
  let controller: StorageController;

  beforeEach(() => {
    storageService = {
      getSignedUrlForUploadStorage: jest.fn().mockResolvedValue('https://s3/put'),
      getSignedUrlForDownloadStorage: jest.fn().mockResolvedValue('https://s3/get'),
      createMultipartUpload: jest.fn().mockResolvedValue({ UploadId: 'upload1' }),
    };
    const configService = { getOrThrow: jest.fn().mockReturnValue('bucket') };
    controller = new StorageController(configService as any, storageService as any, {} as any);
  });

  const member = (overrides: Record<string, any> = {}) =>
    ({ appId: 'appA', memberId: 'm1', role: 'general-member', permissions: [], ...overrides } as any);
  const body = (prefix: string, fileName = 'file.xlsx') => ({ appId: 'ignored', prefix, fileName } as any);

  it('keeps ebook upload / download working (admin ProgramContentAdminBlock)', async () => {
    const staff = member({ permissions: ['PROGRAM_ADMIN'] });
    await expect(controller.uploadFileToStorageBucket(body('ebook', 'content1.epub'), staff)).resolves.toBe(
      'https://s3/put',
    );
    expect(storageService.getSignedUrlForUploadStorage).toHaveBeenCalledWith('appA', 'content1.epub', 'ebook', 60);
    await expect(controller.getDownloadUrlFromStorageBucket(body('ebook', 'content1.epub'), staff)).resolves.toBe(
      'https://s3/get',
    );
    expect(storageService.getSignedUrlForDownloadStorage).toHaveBeenCalledWith('ebook/appA/content1.epub', 60);
  });

  it.each(['export', 'import'])('refuses %s files to a general member', async prefix => {
    await expect(controller.getDownloadUrlFromStorageBucket(body(prefix), member())).rejects.toMatchObject({
      code: 'E_STORAGE_KEY_FORBIDDEN',
    });
    await expect(controller.uploadFileToStorageBucket(body(prefix), member())).rejects.toMatchObject({
      code: 'E_STORAGE_KEY_FORBIDDEN',
    });
    expect(storageService.getSignedUrlForDownloadStorage).not.toHaveBeenCalled();
    expect(storageService.getSignedUrlForUploadStorage).not.toHaveBeenCalled();
  });

  it('allows member import uploads for MEMBER_ADMIN and coin import uploads for COIN_ADMIN', async () => {
    await controller.uploadFileToStorageBucket(
      body('import', 'members.csv'),
      member({ permissions: ['MEMBER_ADMIN'] }),
    );
    await controller.uploadFileToStorageBucket(body('import', 'coins.csv'), member({ permissions: ['COIN_ADMIN'] }));
    expect(storageService.getSignedUrlForUploadStorage).toHaveBeenCalledTimes(2);
  });

  it('allows export files for order / member export permissions and the app owner', async () => {
    for (const caller of [
      member({ permissions: ['SALES_RECORDS_ADMIN'] }),
      member({ permissions: ['MEMBER_ADMIN'] }),
      member({ role: 'app-owner' }),
    ]) {
      await controller.getDownloadUrlFromStorageBucket(body('export', 'member/member_export.xlsx'), caller);
    }
    expect(storageService.getSignedUrlForDownloadStorage).toHaveBeenCalledWith(
      'export/appA/member/member_export.xlsx',
      60,
    );
    expect(storageService.getSignedUrlForDownloadStorage).toHaveBeenCalledTimes(3);
  });

  it('does not let an unrelated permission open export files', async () => {
    await expect(
      controller.getDownloadUrlFromStorageBucket(body('export'), member({ permissions: ['PROGRAM_ADMIN'] })),
    ).rejects.toMatchObject({ code: 'E_STORAGE_KEY_FORBIDDEN' });
  });

  it.each([
    ['multi-segment prefix', 'vod/appB', 'file'],
    ['dot-dot prefix', '..', 'file'],
    ['empty prefix', '', 'file'],
    ['dot-dot in fileName', 'ebook', '../../export/appA/x.xlsx'],
    ['empty fileName', 'ebook', ''],
  ])('rejects %s', async (_label, prefix, fileName) => {
    await expect(
      controller.getDownloadUrlFromStorageBucket(body(prefix, fileName), member({ role: 'app-owner' })),
    ).rejects.toMatchObject({ code: 'E_STORAGE_KEY_FORBIDDEN' });
  });

  it('applies the same export/import rule to multipart keys', async () => {
    await expect(
      controller.createMultipartUpload({ params: { Key: 'export/appA/x/y.xlsx', ContentType: 'text/csv' } }, member()),
    ).rejects.toMatchObject({ code: 'E_STORAGE_KEY_FORBIDDEN' });
    await expect(
      controller.createMultipartUpload(
        { params: { Key: 'vod/appA/ab/abcd/video/f', ContentType: 'video/mp4' } },
        member({ permissions: ['MEDIA_LIBRARY_ADMIN'] }),
      ),
    ).resolves.toEqual({ uploadId: 'upload1' });
  });
});
