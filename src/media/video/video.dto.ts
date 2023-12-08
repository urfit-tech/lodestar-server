import { IsString } from 'class-validator';
import { CfVideoStreamOptions } from './video.type';

export class VideoTokenDTO {
  token: string;
  cloudflareOptions: CfVideoStreamOptions;
}

export class VideoCaptionDTO {
  @IsString()
  key: string;
}
