import { EntityManager, FindOptionsWhere } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { MerchandiseSpec } from '../entity/MerchandiseSpec';
import { MerchandiseSpecInventoryStatusView } from '../entity/MerchandiseSpecInventoryStatusView';

@Injectable()
export class MerchandiseSpecInfrastructure {
  getMerchandiseSpec(
    conditions: FindOptionsWhere<MerchandiseSpec> | FindOptionsWhere<MerchandiseSpec>[],
    manager: EntityManager,
  ) {
    return manager.getRepository(MerchandiseSpec).findOne({
      where: conditions,
    });
  }

  getMerchandiseSpecInventoryStatus(
    conditions:
      | FindOptionsWhere<MerchandiseSpecInventoryStatusView>
      | FindOptionsWhere<MerchandiseSpecInventoryStatusView>[],
    manager: EntityManager,
  ) {
    return manager.getRepository(MerchandiseSpecInventoryStatusView).findOne({
      where: conditions,
    });
  }
}
