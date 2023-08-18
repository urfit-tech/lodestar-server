import { Logger, Module } from '@nestjs/common';

import { AuthModule } from '~/auth/auth.module';
import { ProgramService } from '~/program/program.service';
import { UtilityService } from '~/utility/utility.service';

import { AudioService } from './audio/audio.service';
import { ImageService } from './image/image.service';
import { VideoService } from './video/video.service';
import { VideoController } from './video/video.controller';
import { MediaInfrastructure } from './media.infra';

@Module({
  controllers: [VideoController],
  imports: [AuthModule],
  providers: [Logger, AudioService, ImageService, MediaInfrastructure, ProgramService, UtilityService, VideoService],
})
export class MediaModule {}
