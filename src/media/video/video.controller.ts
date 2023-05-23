import { Controller, Headers, Param, Post, Get, Body } from '@nestjs/common';

import { VideoService } from './video.service';
import { DownloadableFileDTO, VideoTokenDTO } from './video.dto';

@Controller({
  path: 'videos',
  version: ['1', '2'],
})
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Post(':videoId/token')
  async getCfToken(
    @Headers('Authorization') authorization: string,
    @Param('videoId') videoId: string,
  ): Promise<{ code: string; message: string; result: VideoTokenDTO }> {
    const [_, token] = authorization ? authorization.split(' ') : [undefined, undefined];

    const { videoToken, cfOptions } = await this.videoService.generateCfVideoToken(videoId, token);
    return {
      code: 'SUCCESS',
      message: 'successfully sign the url',
      result: { token: videoToken, cloudflareOptions: cfOptions },
    };
  }

  @Get(':videoId/download')
  async getCloudflareDownloadableFile(
    @Param('videoId') videoId: string,
  ): Promise<{ code: string; message: string; result: DownloadableFileDTO }> {
    const { status, url, percentComplete } = await this.videoService.generateCloudFlareDownloadableFile(videoId);

    if (status !== 'ready' && percentComplete !== 100) {
      return {
        code: 'SUCCESS',
        message: 'file still processing',
        result: { status, url, percentComplete },
      };
    }

    return {
      code: 'SUCCESS',
      message: 'successfully get downloadable file',
      result: { status, url, percentComplete },
    };
  }

  @Post(':videoId/download')
  async generateCloudflareDownloadableFile(
    @Param('videoId') videoId: string,
  ): Promise<{ code: string; message: string; result: DownloadableFileDTO }> {
    const { status, url, percentComplete } = await this.videoService.generateCloudFlareDownloadableFile(videoId);

    return {
      code: 'SUCCESS',
      message: 'successfully generate downloadable file',
      result: { status, url, percentComplete },
    };
  }
}
