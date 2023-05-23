import { CfVideoStreamOptions } from './video.type';

export class VideoTokenDTO {
  token: string;
  cloudflareOptions: CfVideoStreamOptions;
}

export class DownloadableFileDTO {
  status: string;
  url: string;
  percentComplete: number;
}
