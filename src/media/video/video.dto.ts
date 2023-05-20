import { CfVideoStreamOptions } from './video.type';

export class VideoTokenDTO {
  token: string;
  cloudflareOptions: CfVideoStreamOptions;
};
