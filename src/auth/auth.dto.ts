import { IsArray, IsBoolean, IsEmail, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { IsNullable, IsUndefinable } from '~/decorator';
import { PublicMember } from '~/member/member.type';

export class JwtDTO {
  @IsString()
  sub: string;

  @IsString()
  appId: string;

  @IsString()
  role: string;

  @IsString({ each: true })
  permissions: Array<string>;

  @IsString()
  @IsOptional()
  orgId?: string | null;

  @IsString()
  @IsUndefinable()
  memberId?: string;

  @IsString()
  @IsUndefinable()
  name?: string;

  @IsString()
  @IsUndefinable()
  username?: string;

  @IsEmail()
  @IsUndefinable()
  email?: string;

  @IsString()
  @IsUndefinable()
  phoneNumber?: string;

  @IsBoolean()
  @IsOptional()
  isBusiness?: boolean | null;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PublicMember)
  @IsUndefinable()
  loggedInMembers?: Array<PublicMember>;

  @IsString()
  @IsOptional()
  pictureUrl?: string | null;

  @IsUndefinable()
  options?: Record<string, any>;
}

export type JwtMember = JwtDTO;

export class GeoLocation {
  @IsString()
  @IsNullable()
  ip: string;

  @IsString()
  @IsNullable()
  country: string;

  @IsString()
  @IsNullable()
  countryCode: string;
}

export class RefreshTokenDTO {
  @IsString()
  appId: string;

  @IsString()
  @IsOptional()
  fingerPrintId: string | null;

  @ValidateNested()
  @Type(() => GeoLocation)
  geoLocation: GeoLocation;
}
