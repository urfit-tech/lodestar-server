import { EntityManager, In } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';

import { ProgramContent } from './entity/program_content.entity';

@Injectable()
export class ProgramService {
  constructor(
    @InjectEntityManager('phdb') private readonly entityManager: EntityManager,
  ) {}

  public async getTrailProgramContentByAttachmentId(attachmentId: string): Promise<Array<ProgramContent>> {
    const programContentRepo = this.entityManager.getRepository(ProgramContent);
    return programContentRepo.findBy({
      displayMode: In(['trail', 'loginToTrial']),
      programContentVideos: {
        attachment: { id: attachmentId },
      },
    });
  }
}
