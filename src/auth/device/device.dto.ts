import { IsString } from 'class-validator';

export class ManageLoggedInLimitDTO {
  @IsString()
  appId: string;
  @IsString()
  memberId: string;
  @IsString()
  fingerPrintId: string;
}
