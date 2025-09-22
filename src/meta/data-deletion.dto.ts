import { IsString } from 'class-validator';

export class DataDeletionRequestDto {
  @IsString()
  signed_request: string;
}
