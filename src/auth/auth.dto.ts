import { IsArray, IsBoolean, IsEmail, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { IsUndefinable } from '~/decorator';
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

  @IsUndefinable()
  options?: Record<string, any>;
};
