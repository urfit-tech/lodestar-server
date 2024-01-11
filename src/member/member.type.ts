import { IsEmail, IsString } from 'class-validator';

import { MemberOauth } from './entity/member_oauth.entity';
import { MemberPermission } from './entity/member_permission.entity';
import { MemberPhone } from './entity/member_phone.entity';

export enum MemberRole {
  GENERAL_MEMBER = 'general-member',
  CONTENT_CREATOR = 'content-creator',
  APP_OWNER = 'app-owner',
  ORG_MANAGER = 'org-manager',
}

export interface LoginMemberMetadata {
  phones: Array<MemberPhone | null>;
  oauths: Array<MemberOauth | null>;
  permissions: Array<MemberPermission | null>;
}

export class PublicMember {
  @IsString()
  id: string;

  @IsString()
  orgId: string;

  @IsString()
  appId: string;

  @IsEmail()
  email: string;

  @IsString()
  username: string;

  @IsString()
  name: string;

  @IsString()
  pictureUrl: string;

  @IsString()
  isBusiness: boolean;
}
export interface DeleteMemberInfo {
  email: string;
  id: string;
  appId: string;
}

export interface ExecutorInfo {
  memberId: string;
  ipAddress: string;
  dateTime: Date;
  executeResult: string;
}
