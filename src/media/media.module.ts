import { Module } from '@nestjs/common';

import { UtilityService } from '~/utility/utility.service';

import { AudioService } from './audio/audio.service';
import { ImageService } from './image/image.service';
import { VideoService } from './video/video.service';
import { VideoController } from './video/video.controller';
import { MediaInfrastructure } from './media.infra';

@Module({
  controllers: [VideoController],
  providers: [
    AudioService,
    ImageService,
    MediaInfrastructure,
    UtilityService,
    VideoService,
  ],
})
export class MediaModule {}
