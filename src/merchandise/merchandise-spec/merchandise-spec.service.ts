import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager, FindOptionsWhere, LessThanOrEqual } from 'typeorm';
import { PermissionSet } from '~/enums/PermissionSet.enum';
import { UtilityService } from '~/utility/utility.service';
import { MerchandiseSpec } from '../entity/MerchandiseSpec';
import { MerchandiseSpecInfrastructure } from './merchandise-spec.infra';

@Injectable()
export class MerchandiseSpecService {
  constructor(
    @InjectEntityManager() private readonly entityManager: EntityManager,
    private merchandiseSpecInfrastructure: MerchandiseSpecInfrastructure,
    private readonly utilityService: UtilityService,
  ) {}

  async getMerchandiseSpecInventoryStatus(
    appId: string,
    merchandiseSpecId: string,
    memberId?: string,
    role?: string,
    permissions?: string[],
  ) {
    let conditions: FindOptionsWhere<MerchandiseSpec> | FindOptionsWhere<MerchandiseSpec>[];

    if (role === 'app-owner' || permissions?.includes(PermissionSet['MERCHANDISE_ADMIN'])) {
      conditions = { id: merchandiseSpecId, isDeleted: false, merchandise: { isDeleted: false, appId } };
    } else if (permissions?.includes(PermissionSet['MERCHANDISE_NORMAL'])) {
      conditions = { id: merchandiseSpecId, isDeleted: false, merchandise: { isDeleted: false, appId, memberId } };
    } else {
      conditions = {
        id: merchandiseSpecId,
        isDeleted: false,
        merchandise: { isDeleted: false, appId, publishedAt: LessThanOrEqual(new Date()) },
      };
    }

    const merchandiseSpec = await this.merchandiseSpecInfrastructure.getMerchandiseSpec(conditions, this.entityManager);
    const inventoryStatus = await this.merchandiseSpecInfrastructure.getMerchandiseSpecInventoryStatus(
      { merchandiseSpecId: merchandiseSpec.id },
      this.entityManager,
    );
    return this.utilityService.convertObjectKeysToCamelCase({
      ...merchandiseSpec,
      merchandiseSpecInventoryStatus: inventoryStatus,
    });
  }
}
