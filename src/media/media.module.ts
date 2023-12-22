import { Logger, Module } from '@nestjs/common';

import { AuthModule } from '~/auth/auth.module';
import { ProgramService } from '~/program/program.service';
import { UtilityService } from '~/utility/utility.service';

import { AudioService } from './audio/audio.service';
import { ImageService } from './image/image.service';
import { VideoService } from './video/video.service';
import { VideoController } from './video/video.controller';
import { MediaInfrastructure } from './media.infra';
import { MemberModule } from '~/member/member.module';
import { ProgramInfrastructure } from '~/program/program.infra';
import { MediaService } from './media.service';
import { StorageService } from '~/utility/storage/storage.service';
import { AppModule } from '~/app/app.module';
import { DeviceModule } from '~/auth/device/device.module';
import { CacheService } from '~/utility/cache/cache.service';
import { MailerModule } from '~/mailer/mailer.module';

@Module({
  controllers: [VideoController],
  imports: [AppModule, AuthModule, DeviceModule, MemberModule, MailerModule],
  providers: [
    Logger,
    AudioService,
    CacheService,
    ImageService,
    StorageService,
    MediaInfrastructure,
    ProgramService,
    UtilityService,
    VideoService,
    MediaService,
    ProgramInfrastructure,
  ],
  exports: [MediaService],
})
export class MediaModule {}
