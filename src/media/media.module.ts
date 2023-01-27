import { Module } from '@nestjs/common'
import { AudioService } from './audio/audio.service'
import { ImageService } from './image/image.service'
import { VideoService } from './video/video.service'

@Module({
  providers: [AudioService, VideoService, ImageService],
})
export class MediaModule {}
