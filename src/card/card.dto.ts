import { ApiProperty } from '@nestjs/swagger';

export class CardResponseDTO {
  @ApiProperty()
  id: string;
  @ApiProperty()
  title: string;
  @ApiProperty()
  description: string | null;
  @ApiProperty()
  template: string | null;
  @ApiProperty()
  creator: {
    id: string;
    name: string;
  };
  @ApiProperty()
  sku: string | null;
  @ApiProperty()
  fixedStartDate: Date | null;
  @ApiProperty()
  relativePeriodType: 'Y' | 'W' | 'M' | 'D' | null;
  @ApiProperty()
  relativePeriodAmount: number | null;
  @ApiProperty()
  expireType: 'fixed' | 'relative';
  @ApiProperty()
  fixedEndDate: Date | null;
  @ApiProperty()
  members: {
    id: string;
    order: {
      id: string;
    };
  };
  @ApiProperty()
  cardProducts: {
    id: string;
    productType: string;
    target: string;
  }[];
  cardDiscounts: {
    id: string;
    product_id: string;
    amount: number;
    type: 'cash' | 'percentage';
  }[];
}
