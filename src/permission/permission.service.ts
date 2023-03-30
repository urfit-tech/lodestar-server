import { Injectable } from "@nestjs/common";
import { EntityManager, In } from "typeorm";

import { Permission } from "~/entity/Permission";

@Injectable()
export class PermissionService {
  async getByIds(permissionIds: Array<string>, manager: EntityManager): Promise<Array<Permission>> {
    const permissionRepo = manager.getRepository(Permission);
    const founds = await permissionRepo.findBy({ id: In(permissionIds) });
    return founds;
  }
}