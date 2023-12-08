import { Body, Controller, Get, Headers, Logger, Param, Post, Put, UseGuards } from '@nestjs/common';

import { VideoService } from './video.service';
import { VideoCaptionDTO, VideoTokenDTO } from './video.dto';
import { Local } from '~/decorator';
import { JwtMember } from '~/auth/auth.dto';
import { AuthGuard } from '~/auth/auth.guard';

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
  @UseGuards(AuthGuard)
  @Post(':videoId/captions')
  async updateCaptions(
    @Param('videoId') videoId: string,
    @Body() body: VideoCaptionDTO,
  ): Promise<{ code: string; message: string; result: [] }> {
    try {
      const { key } = body;
      await this.videoService.updateAttachmentOptionsAfterCaptionUploaded(videoId, key);
      return {
        code: 'SUCCESS',
        message: 'successfully update attachment options s3 captions',
        result: null,
      };
    } catch (err) {
      this.logger.error(err);
    }
  }
}
