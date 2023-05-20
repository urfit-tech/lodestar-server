import { Controller, Param, Post } from "@nestjs/common";
import { VideoService } from "./video.service";

@Controller({
  path: 'videos',
  version: ['1', '2'],
})
export class VideoController {
  constructor(
    private readonly videoService: VideoService,
  ) {}

  @Post(':videoId/tokens')
  getCfToken(@Param('videoId') videoId: string): Promise<string> {
    return this.videoService.generateCfVideoToken(videoId);
  }
}
