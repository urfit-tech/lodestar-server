import { EntityManager } from 'typeorm';
import { Injectable } from '@nestjs/common';

import { Attachment } from './attachment.entity';

@Injectable()
export class MediaInfrastructure {
  async getById(id: string, manager: EntityManager): Promise<Attachment> {
    const attachmentRepo = manager.getRepository(Attachment);
    return attachmentRepo.findOneBy({ id });
  }
  async insertAttachment(
    manager: EntityManager,
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
    const attachmentRepo = manager.getRepository(Attachment);
    return await attachmentRepo.save({
      id: attachmentId,
      appId,
      author: { id: authorId },
      name: name,
      filename: name,
      contentType: type,
      size: size,
      status,
      duration,
      options: options,
    });
  }
}
