import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export enum MemberRole {
  GENERAL_MEMBER = 'general-member',
  CONTENT_CREATOR = 'content-creator',
  APP_OWNER = 'app-owner',
  ORG_MANAGER = 'org-manager',
};

export interface PublicMember {
  id: string;
  orgId: string;
  appId: string;
  email: string;
  username: string;
  name: string;
  pictureUrl: string;
  isBusiness: boolean;
};

export class MemberCsvHeaderMappingInfo {
  @IsString() @IsNotEmpty() id: string;
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() username: string;
  @IsString() @IsNotEmpty() email: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  categories: Array<string>;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  properties: Array<string>;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  phones: Array<string>;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  tags: Array<string>;

  @IsString() @IsNotEmpty() star: string;
  @IsString() @IsNotEmpty() createdAt: string;
};
