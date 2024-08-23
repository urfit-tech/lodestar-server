import { IsString } from 'class-validator';

export class IssueInvoiceBodyDTO {
  @IsString()
  paymentNo: string;
}
