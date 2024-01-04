import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Logger,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';

import { VideoService } from './video.service';
import { VideoCaptionDTO, VideoSignResponseDTO, VideoTokenDTO } from './video.dto';
import { AuthGuard } from '~/auth/auth.guard';
import { StorageService } from '~/utility/storage/storage.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { APIException } from '~/api.excetion';
import { validate as isValidUUID } from 'uuid';

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
  ): Promise<{ code: string; message: string; result: string }> {
    const { buffer } = file;
    try {
      const key = await this.videoService.uploadCaption(videoId, body.key, buffer);
      return {
        code: 'SUCCESS',
        message: 'successfully update attachment options s3 captions',
        result: key,
      };
    } catch (err) {
      throw new APIException({
        code: 'E_UPDATE_CAPTIONS',
        message: err.message,
        result: null,
      });
    }
  }

  @UseGuards(AuthGuard)
  @Get(':videoId/captions')
  async getCaptions(
    @Param('videoId') videoId: string,
  ): Promise<{ code: string; message: string; result: Array<string> }> {
    try {
      const keys = await this.videoService.getCaptions(videoId);
      return {
        code: 'SUCCESS',
        message: 'successfully get s3 captions',
        result: keys,
      };
    } catch (err) {
      throw new APIException({
        code: 'E_GET_CAPTIONS',
        message: err.message,
        result: [],
      });
    }
  }

  @UseGuards(AuthGuard)
  @Delete(':videoId/captions/:filename')
  async deleteCaptions(
    @Param('filename') filename: string,
    @Param('videoId') videoId: string,
  ): Promise<{ code: string; message: string; result: Array<string> }> {
    try {
      const keys = await this.videoService.deleteCaptions(videoId, filename);
      return {
        code: 'SUCCESS',
        message: 'successfully delete s3 captions',
        result: keys,
      };
    } catch (err) {
      throw new APIException({
        code: 'E_DELETE_CAPTIONS',
        message: err.message,
        result: [],
      });
    }
  }

  @Get(['*.m3u8', '*.mpd'])
  async getManifestWithSignUrl(@Req() request: Request) {
    try {
      const [key, signature] = decodeURI(request.url).split('videos/')[1].split('?');
      const sanitizeSignature = sanitizeHtml(signature).replace(/&amp;/g, '&');
      const manifest = await this.storageService.getFileFromBucketStorage({
        Key: key,
      });
      const signedManifest = await this.videoService.parseManifestWithSignUrl(
        await manifest.Body.transformToString(),
        key,
        sanitizeSignature,
      );
      return signedManifest;
    } catch (err) {
      throw new APIException({
        code: 'E_GET_M3U8',
        message: err.message,
        result: null,
      });
    }
  }

  @Get(':videoId/sign')
  async signUrl(
    @Headers('Authorization') authorization: string,
    @Param('videoId') videoId: string,
  ): Promise<{ message: string; code: string; result: VideoSignResponseDTO }> {
    if (!isValidUUID(videoId)) {
      throw new APIException({
        code: 'E_SIGN_URL',
        message: `Invalid videoId'`,
      });
    }

    const [_, token] = authorization ? authorization.split(' ') : [undefined, undefined];
    const signedData = await this.videoService.generateCloudfrontSignedUrl(videoId, token);
    return {
      code: 'SUCCESS',
      message: 'success set signedUrl',
      result: signedData,
    };
  }
}
