import { IsString } from 'class-validator';

export enum LoginStatus {
  E_NO_MEMBER,
  I_RESET_PASSWORD,
  E_PASSWORD,
  SUCCESS,
}

export class GeneralLoginDTO {
  @IsString()
  appId: string;

  @IsString()
  account: string;

  @IsString()
  password: string;
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
