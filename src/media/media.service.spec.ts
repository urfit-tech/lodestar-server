import { Attachment } from './attachment.entity';
import { MediaService } from './media.service';

describe('MediaService.upsertMediaVideoAttachment', () => {
  let mediaInfra: { getById: jest.Mock; upsertAttachment: jest.Mock };
  let service: MediaService;

  const newAttachment = (appId: string) => {
    const attachment = new Attachment();
    attachment.id = 'att1';
    attachment.appId = appId;
    attachment.authorId = 'admin1';
    return attachment;
  };

  beforeEach(() => {
    mediaInfra = {
      getById: jest.fn(),
      upsertAttachment: jest.fn().mockImplementation(async attachment => attachment),
    };
    service = new MediaService({} as any, mediaInfra as any);
  });

  it('inserts a new attachment with the s3 video source', async () => {
    mediaInfra.getById.mockResolvedValue(null);
    const saved = await service.upsertMediaVideoAttachment(newAttachment('appA'), 'bucket', 'vod/appA/at/att1/video/f');
    expect(saved.options).toEqual({ source: { s3: { video: 's3://bucket/vod/appA/at/att1/video/f' } } });
  });

  it('updates an attachment of the same app', async () => {
    mediaInfra.getById.mockResolvedValue({ id: 'att1', appId: 'appA', options: { source: { s3: { video: 'old' } } } });
    const saved = await service.upsertMediaVideoAttachment(newAttachment('appA'), 'bucket', 'vod/appA/at/att1/video/f');
    expect(saved.options.source.s3.video).toBe('s3://bucket/vod/appA/at/att1/video/f');
    expect(mediaInfra.upsertAttachment).toHaveBeenCalledTimes(1);
  });

  it('refuses to overwrite an attachment of another app', async () => {
    mediaInfra.getById.mockResolvedValue({ id: 'att1', appId: 'appB', options: {} });
    await expect(
      service.upsertMediaVideoAttachment(newAttachment('appA'), 'bucket', 'vod/appA/at/att1/video/f'),
    ).rejects.toMatchObject({ code: 'E_ATTACHMENT_FORBIDDEN' });
    expect(mediaInfra.upsertAttachment).not.toHaveBeenCalled();
  });
});
