import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsObject, IsString } from 'class-validator';

export class ParticipantsCountDto {
  @ApiProperty()
  online: number;

  @ApiProperty()
  offline: number;
}

export class ActivityDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ type: String, nullable: true })
  coverUrl: string | null;

  @ApiProperty()
  title: string;

  @ApiProperty({ type: String, nullable: true, example: '2023-07-19T12:36:52.248Z' })
  publishedAt: Date | null;

  @ApiProperty({ example: ['offline', 'online'] })
  includeSessionTypes: ('offline' | 'online')[];

  @ApiProperty({ type: ParticipantsCountDto })
  participantsCount: ParticipantsCountDto;

  @ApiProperty({ type: String, nullable: true, example: '2023-07-19T12:36:52.248Z' })
  startedAt: Date | null;

  @ApiProperty({ type: String, nullable: true, example: '2023-07-21T12:36:52.248Z' })
  endedAt: Date | null;

  @ApiProperty()
  isPrivate: boolean;

  constructor(data?: Partial<ActivityDto>) {
    if (data) {
      Object.assign(this, data);
    }
  }
}

export class FetchActivitiesResponseDto {
  @ApiProperty({ type: [ActivityDto] })
  activities: ActivityDto[];

  @ApiProperty()
  totalCount: number;
}

export class ActivityCollectionDTO {
  @IsObject()
  basicCondition: ActivityBasicCondition;

  @IsNumber()
  limit: number;

  @IsNumber()
  offset: number;

  @IsString()
  categoryId: string;
}
