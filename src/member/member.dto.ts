import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEmail,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { DeleteResult } from 'typeorm';
import { Cursor } from 'typeorm-cursor-pagination';

import { MemberRole } from './member.type';
import { isArray } from 'lodash';

class FileInfo {
  @IsString()
  key: string;

  @IsString()
  checksum: string;
}

export class MemberGetQueryOptionsDTO {
  @IsOptional()
  @IsString()
  prevToken?: string;

  @IsOptional()
  @IsString()
  nextToken?: string;

  @IsOptional()
  @IsNumber()
  limit?: number;
}

export class MemberGetConditionDTO {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @IsOptional()
  role?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  managerName?: string;

  @IsString()
  @IsOptional()
  managerId?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  tag?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  permissionGroup?: string;

  @IsArray()
  @IsOptional()
  properties?: MemberPropertiesCondition[];
}

export class MemberPropertiesCondition {
  [propertyId: string]: string;
}

export class MemberGetDTO {
  @IsOptional()
  @ValidateNested()
  @Type(() => MemberGetQueryOptionsDTO)
  option?: MemberGetQueryOptionsDTO;

  @IsOptional()
  @ValidateNested()
  @Type(() => MemberGetConditionDTO)
  condition?: MemberGetConditionDTO;
}

export class MemberGetResultDTO {
  cursor: Cursor;
  data: Array<{
    id: string;
    picture_url: string;
    name: string;
    email: string;
    role: string;
    created_at: Date;
    username: string;
    logined_at: Date;
    manager_id: string;
  }>;
}

export class MemberImportDTO {
  @IsString()
  appId: string;

  @ValidateNested()
  @Type(() => FileInfo)
  fileInfos: Array<FileInfo>;
}

export class MemberExportDTO {
  @IsString()
  appId: string;

  @IsArray()
  @IsString({ each: true })
  memberIds: Array<string>;

  @IsString()
  @IsOptional()
  exportMime?: string;
}

export class MemberImportResultDTO {
  toInsertCount: number;
  insertedCount: number;
  failedCount: number;
  failedErrors: any;
}

export class MemberDeleteResultDTO {
  code: 'SUCCESS' | 'ERROR';
  message: DeleteResult;
}

export class MemberGeneralLoginDTO {
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
  phoneNumber: string;

  @IsString()
  passhash: string;

  @IsString()
  pictureUrl: string;

  @IsString()
  description: string;

  @IsString()
  refreshToken: string;

  @IsEnum(MemberRole)
  role: MemberRole;

  @IsString({ each: true })
  permissions: Array<string>;

  @IsBoolean()
  isBusiness: boolean;
}

export class ActiveMemberContractDTO {
  @IsString()
  memberId: string;

  @IsDate()
  agreed_at: Date;

  @IsDate()
  revoked_at: Date;

  @ValidateNested()
  values: any;
}

export class MemberTaskDTO {
  @IsString()
  memberId: string;

  @IsString()
  status: string;
}

export class MemberPropertyDTO {
  @IsString()
  memberId: string;

  @IsString()
  propertyId: string;

  @ValidateNested()
  value: any;

  @IsString()
  name: string;
}

export class MemberPhoneDTO {
  @IsString()
  memberId: string;

  @IsString()
  phone: string;
}

export class MemberNoteDTO {
  @IsString()
  memberId: string;

  @IsString()
  description: string;
}

export class MemberCategoryDTO {
  @IsString()
  memberId: string;

  @IsString()
  categoryId: string;
}

export class SaleLeadMemberDataResponseDTO {
  @IsString()
  member_id: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActiveMemberContractDTO)
  activeMemberContract: ActiveMemberContractDTO[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MemberTaskDTO)
  memberTask: MemberTaskDTO[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MemberPropertyDTO)
  memberProperty: MemberPropertyDTO[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MemberPhoneDTO)
  memberPhone: MemberPhoneDTO[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MemberNoteDTO)
  memberNote: MemberNoteDTO[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MemberCategoryDTO)
  memberCategory: MemberCategoryDTO[];
}

export class SaleLeadMemberDataResquestDTO {
  @IsString()
  managerId: string;

  @IsString()
  appId: string;
}
