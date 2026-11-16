import { Injectable } from '@nestjs/common';
import { APIException } from '~/api.excetion';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { Attachment } from './attachment.entity';
import { MediaInfrastructure } from './media.infra';

@Injectable()
export class MediaService {
  constructor(
    @InjectEntityManager() private readonly entityManager: EntityManager,
    private readonly mediaInfra: MediaInfrastructure,
  ) {}

  async upsertMediaVideoAttachment(attachment: Attachment, s3Bucket?: string, key?: string) {
    const existAttachment = await this.mediaInfra.getById(attachment.id, this.entityManager);

    // Never overwrite (or move) an attachment row that belongs to another app.
    if (existAttachment && existAttachment.appId !== attachment.appId) {
      throw new APIException({ code: 'E_ATTACHMENT_FORBIDDEN', message: 'attachment belongs to another app' }, 403);
    }

    if (existAttachment?.options?.source?.s3?.video) {
      existAttachment.options.source.s3.video = `s3://${s3Bucket}/${key}`;
      attachment.options = existAttachment.options;
    } else {
      attachment.options = {
        ...existAttachment?.options,
        source: {
          ...existAttachment?.options?.source,
          s3: { ...existAttachment?.options?.source?.s3, video: `s3://${s3Bucket}/${key}` },
        },
      };
    }
    attachment.updatedAt = new Date();

    return await this.mediaInfra.upsertAttachment(attachment, this.entityManager);
  }
}
