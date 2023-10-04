import { Injectable } from '@nestjs/common';
import { EntityManager, In } from 'typeorm';

import { Permission } from './entity/permission.entity';

@Injectable()
export class PermissionInfrastructure {
  async getByIds(permissionIds: Array<string>, manager: EntityManager): Promise<Array<Permission>> {
    const permissionRepo = manager.getRepository(Permission);
    const founds = await permissionRepo.findBy({ id: In(permissionIds) });
    return founds;
  }
}
