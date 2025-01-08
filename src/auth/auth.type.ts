import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { GeoLocation } from './auth.dto';

export enum LoginStatus {
  E_NO_MEMBER,
  I_RESET_PASSWORD,
  E_PASSWORD,
  SUCCESS,
}

export enum RefreshStatus {
  E_NO_MEMBER,
  E_SESSION_DESTROY,
  E_NO_DEVICE,
  SUCCESS,
}

export class GeneralLoginDTO {
  @IsString()
  appId: string;

  @IsString()
  account: string;

  @IsString()
  password: string;

  @IsString()
  @IsOptional()
  fingerPrintId: string | null;

  @ValidateNested()
  @Type(() => GeoLocation)
  geoLocation: GeoLocation;
}

export interface CrossServerTokenDTO {
  clientId: string;
  key: string;
  permissions: Array<string>;
}

export interface GenerateTmpPasswordDTO {
  appId: string;
  applicant: string;
  email: string;
  purpose: string;
}
