import { IsString } from 'class-validator';

export class EbookRequestDTO {
  @IsString()
  programContentId: string;
}

export class EbookResponseDTO {}
