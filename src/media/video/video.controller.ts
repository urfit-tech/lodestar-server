import { Controller, Headers, Logger, Param, Post } from '@nestjs/common';

import { VideoService } from './video.service';
import { VideoTokenDTO } from './video.dto';

@Controller({
  path: 'videos',
  version: ['1', '2'],
})
export class VideoController {
  constructor(private readonly logger: Logger, private readonly videoService: VideoService) {}

  @Post(':videoId/token')
  async getCfToken(
    @Headers('Authorization') authorization: string,
    @Param('videoId') videoId: string,
  ): Promise<{ code: string; message: string; result: VideoTokenDTO }> {
    try {
      const [_, token] = authorization ? authorization.split(' ') : [undefined, undefined];

      const { videoToken, cfOptions } = await this.videoService.generateCfVideoToken(videoId, token);
      return {
        code: 'SUCCESS',
        message: 'successfully sign the url',
        result: { token: videoToken, cloudflareOptions: cfOptions },
      };
    } catch (err) {
      this.logger.error(err);
    }
  }
}
