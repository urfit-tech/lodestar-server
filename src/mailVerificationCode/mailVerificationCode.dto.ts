import { IsOptional, IsString } from 'class-validator';

export class SendMailVerificationCodeDTO {
  @IsString()
  appId: string;
  @IsString()
  email: string;
  @IsString()
  type: string;
  @IsString()
  @IsOptional()
  ip: string | null;
}

export class VerifyMailVerificationCodeDTO {
  @IsString()
  appId: string;
  @IsString()
  email: string;
  @IsString()
  memberId: string;
  @IsString()
  type: string;
  @IsString()
  code: string;
}
