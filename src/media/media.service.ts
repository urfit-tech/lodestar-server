import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { MediaInfrastructure } from './media.infra';

@Injectable()
export class MediaService {
  constructor(
    @InjectEntityManager() private readonly entityManager: EntityManager,
    private readonly mediaInfra: MediaInfrastructure,
  ) {}

  async insertAttachment(
    appId: string,
    authorId: string,
    attachmentId: string,
    name: string,
    type: string,
    size: number,
    status: string,
    duration: number,
    options: any,
  ) {
    return await this.mediaInfra.insertAttachment(
      this.entityManager,
      appId,
      authorId,
      attachmentId,
      name,
      type,
      size,
      status,
      duration,
      options,
    );
  }
}
