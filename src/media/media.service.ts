import { Injectable } from '@nestjs/common';
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
  async upsertMediaCaptionsAttachment(attachment: Attachment, s3Bucket?: string, key?: string) {
    const existAttachment = await this.mediaInfra.getById(attachment.id, this.entityManager);

    if (existAttachment?.options?.source?.s3?.captions) {
      existAttachment.options.source.s3.captions.push(`s3://${s3Bucket}/${key}`);
      existAttachment.options.source.s3.captions = [...new Set(existAttachment?.options?.source?.s3?.captions)];
      attachment.options = existAttachment.options;
    } else {
      attachment.options = {
        ...existAttachment?.options,
        source: {
          ...existAttachment?.options?.source,
          s3: { ...existAttachment?.options?.source?.s3, captions: [`s3://${s3Bucket}/${key}`] },
        },
      };
    }

    return await this.mediaInfra.upsertAttachment(attachment, this.entityManager);
  }
}
