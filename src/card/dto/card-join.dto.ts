import { ApiProperty } from '@nestjs/swagger';

export class CardJoinDTO {
  @ApiProperty()
  id: string;
  @ApiProperty()
  title: string;
  @ApiProperty()
  description: string | null;
  @ApiProperty()
  template: string | null;
  @ApiProperty()
  sku: string | null;
  @ApiProperty()
  fixedStartDate: string | null;
  @ApiProperty()
  fixedEndDate: string | null;
  @ApiProperty()
  relativePeriodType: 'Y' | 'W' | 'M' | 'D' | null;
  @ApiProperty()
  relativePeriodAmount: number | null;
  @ApiProperty()
  expiryType: 'fixed' | 'relative';
  @ApiProperty()
  creator: {
    id: string;
    name: string;
  };
  @ApiProperty()
  orders: {
    id: string;
    status: string;
    memberId: string;
    memberEmail: string;
    memberName: string;
  }[];
  @ApiProperty()
  cardProducts: {
    id: string;
    productType: string;
    target: string;
  }[];
  cardDiscounts: {
    id: string;
    productId: string;
    amount: number;
    type: 'cash' | 'percentage';
  }[];
}
