import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';

export class ShippingDto {
  @IsString()
  shippingMethod: string;
}

export class CheckoutOrderDto {
  @IsString()
  appId: string;

  @IsOptional()
  @IsString()
  memberId?: string;

  @IsArray()
  @IsString({ each: true })
  productIds: string[];

  @IsOptional()
  @IsString()
  discountId?: string;

  @IsOptional()
  options?: Record<string, any>;

  @IsOptional()
  @ValidateNested()
  @Type(() => ShippingDto)
  shipping?: ShippingDto;
}
