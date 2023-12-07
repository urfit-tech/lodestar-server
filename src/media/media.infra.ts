import { EntityManager } from 'typeorm';
import { Injectable } from '@nestjs/common';

import { Attachment } from './attachment.entity';

@Injectable()
export class MediaInfrastructure {
  async getById(id: string, manager: EntityManager): Promise<Attachment> {
    const attachmentRepo = manager.getRepository(Attachment);
    return attachmentRepo.findOneBy({ id });
  }
  async upsertAttachment(attachment: Attachment, manager: EntityManager) {
    const attachmentRepo = manager.getRepository(Attachment);
    return await attachmentRepo.save(attachment);
  }
}
