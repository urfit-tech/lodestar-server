import { ProductType } from '~/types/product';

import { BaseDTO } from './base.dto';

export class BaseProductDTO extends BaseDTO {
  public readonly id: string;
  public readonly type: ProductType;
  public readonly target: string;
}
