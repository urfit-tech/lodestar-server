import { ApiProperty } from '@nestjs/swagger';
import { DisplayMode } from './program.type';

export class ProgramResponseDTO {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  coverUrl: string;

  @ApiProperty()
  coverMobileUrl: string;

  @ApiProperty()
  coverThumbnailUrl: string;

  @ApiProperty()
  abstract: string;

  @ApiProperty()
  roles: programRoleDto[];

  @ApiProperty()
  viewRate: number;

  @ApiProperty()
  lastViewedAt: Date;

  @ApiProperty()
  deliveredAt: Date;
}

class AudioDataDTO {
  @ApiProperty()
  name: string;

  @ApiProperty()
  size: number;

  @ApiProperty()
  type: string;

  @ApiProperty()
  lastModified: number;
}

class AudioDTO {
  @ApiProperty({ type: AudioDataDTO })
  data: AudioDataDTO;
}

class ProgramContentBodyDataDTO {
  @ApiProperty()
  data: Record<string, any>;

  @ApiProperty()
  description: string;

  @ApiProperty()
  id: string;

  @ApiProperty()
  type: string;
}

class AttachmentDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  data: any;

  @ApiProperty()
  type: string;

  @ApiProperty()
  target: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  options: any | null;

  @ApiProperty()
  appId: string;

  @ApiProperty()
  isDeleted: boolean;

  @ApiProperty()
  contentType: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  size: string;

  @ApiProperty()
  authorId: string;

  @ApiProperty()
  thumbnailUrl: string;

  @ApiProperty()
  filename: string;

  @ApiProperty()
  duration: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  family: any | null;

  @ApiProperty()
  fileId: any | null;
}

class MetadataDTO {
  private: boolean;
  difficulty: number;
  isCoverRequired: boolean;
}

export class ProgramContentResponseDTO {
  @ApiProperty()
  appid: string;

  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  abstract: string | null;

  @ApiProperty()
  contentBodyId: string;

  @ApiProperty()
  publishedAt: Date;

  @ApiProperty()
  duration: string | null;

  @ApiProperty()
  displayMode: DisplayMode;

  @ApiProperty()
  contentType: string;

  @ApiProperty()
  contentSectionTitle: string;

  @ApiProperty({ type: [AudioDTO] })
  audios: AudioDTO[];

  @ApiProperty()
  videos: any[];

  @ApiProperty({ type: [AttachmentDto] })
  attachment: AttachmentDto[];

  @ApiProperty({ type: ProgramContentBodyDataDTO })
  programContentBody: ProgramContentBodyDataDTO;

  @ApiProperty({ type: MetadataDTO })
  metadata: MetadataDTO | null;

  @ApiProperty()
  listPrice: number | null;

  @ApiProperty()
  salePrice: number | null;

  @ApiProperty()
  soldAt: Date | null;

  @ApiProperty()
  pinnedStatus: boolean;

  @ApiProperty()
  isEquity: boolean;
}

export class ProgramContentsResponseDto {
  @ApiProperty()
  programContentId: string;

  @ApiProperty()
  displayMode: string;
}

export class MaterialsResponseDto {
  @ApiProperty()
  programContentId: string;

  @ApiProperty()
  id: string;

  @ApiProperty()
  data: object;

  @ApiProperty()
  createdAt: Date;
}

export class programRoleDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  memberId: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  memberName: string;
}
