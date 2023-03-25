import { ProductType } from '~/types';

import { DTO } from './dto';

export class BaseProductDTO extends DTO {
  public readonly id: string;
  public readonly type: ProductType;
  public readonly target: string;
}
