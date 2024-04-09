import { IsOptional, IsString } from "class-validator";

class ActivityCategoryDto {
  id: string;
  name: string;
}

class ActivitySessionMaxAmountDto {
  online: number;
  offline: number;
}

class ActivitySessionParticipantsDto {
  online: number;
  offline: number;
}

class ActivitySessionDto {
  id: string;
  startedAt: string;
  endedAt: string;
  location: string | null;
  description: string | null;
  threshold: string | null;
  onlineLink: string | null;
  title: string;
  maxAmount: ActivitySessionMaxAmountDto;
  participants: ActivitySessionParticipantsDto;
  isEnrolled: boolean;
  type: 'both' | 'offline' | 'online';
  attended: boolean
}

class ActivityDto {
  id: string;
  title: string;
  coverUrl: string;
  categories: ActivityCategoryDto[];
}

class ActivityInvoiceDto {
  name: string;
  email: string;
  phone: string;
  orderProductId: string;
}

export class MemberRightActivityTicketDataDto {
  id: string;
  activity: ActivityDto;
  sessions: ActivitySessionDto[];
  invoice: ActivityInvoiceDto;
}

export class FetchMemberRightActivityTicketDTO {
  @IsString()
  activityTicketId: string

  @IsOptional()
  @IsString()
  sessionId?: string
}

export class FetchMemberRightActivityTicketQuery {
  @IsString()
  memberId: string

  @IsString()
  activityTicketId: string

  @IsOptional()
  @IsString()
  sessionId?: string
}