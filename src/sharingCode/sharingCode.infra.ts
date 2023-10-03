import { EntityManager, FindOptionsWhere } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { SharingCode } from './entity/sharing_code.entity.';

@Injectable()
export class SharingCodeInfrastructure {
  async getSharingCodeByConditions(conditions: FindOptionsWhere<SharingCode>, manager: EntityManager) {
    const sharingCodeRepo = manager.getRepository(SharingCode);
    const sharingCodes = await sharingCodeRepo.find({
      where: {
        ...(conditions && { ...conditions }),
      },
    });
    return sharingCodes;
  }
}
