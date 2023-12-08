import {
  Body,
  Controller,
  Get,
  Headers,
  Logger,
  Param,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { VideoService } from './video.service';
import { VideoCaptionDTO, VideoTokenDTO } from './video.dto';
import { Local } from '~/decorator';
import { JwtMember } from '~/auth/auth.dto';
import { AuthGuard } from '~/auth/auth.guard';
import { StorageService } from '~/utility/storage/storage.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller({
  path: 'videos',
  version: ['1', '2'],
})
export class VideoController {
  constructor(
    private readonly logger: Logger,
    private readonly videoService: VideoService,
    private readonly storageService: StorageService,
  ) {}

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
  @UseInterceptors(FileInterceptor('file'))
  async updateCaptions(
    @UploadedFile() file: Express.Multer.File,
    @Param('videoId') videoId: string,
    @Body() body: VideoCaptionDTO,
  ): Promise<{ code: string; message: string; result: [] }> {
    const { buffer } = file;
    try {
      await this.videoService.uploadCaption(videoId, body.key, buffer);
      return {
        code: 'SUCCESS',
        message: 'successfully update attachment options s3 captions',
        result: null,
      };
    } catch (err) {
      return {
        code: 'ERROR',
        message: 'error update attachment options s3 captions',
        result: err,
      };
    }
  }

  @UseGuards(AuthGuard)
  @Get(':videoId/captions')
  async getCaptions(@Param('videoId') videoId: string): Promise<{ code: string; message: string; result: [] }> {
    try {
      const keys = await this.videoService.getCaptions(videoId);
      return {
        code: 'SUCCESS',
        message: 'successfully get s3 captions',
        result: keys,
      };
    } catch (err) {
      this.logger.error(err);
    }
  }
}
