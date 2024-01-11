import { Module } from '@nestjs/common';
import { SocialModule } from '~/social/social.module';
import { CallerModule } from '../caller/caller.module';
import { FeedModule } from '../feed/feed.module';
import { MailerModule } from '../mailer/mailer.module';
import { ApolloService } from './apollo/apollo.service';
import { CacheService } from './cache/cache.service';
import { QueueService } from './queue/queue.service';
import { StorageService } from './storage/storage.service';
import { ShutdownService } from './shutdown/shutdown.service';
import { UtilityService } from './utility.service';

import { StorageController } from './storage/storage.controller';
import { AuthModule } from '~/auth/auth.module';
import { MediaService } from '~/media/media.service';
import { MediaInfrastructure } from '~/media/media.infra';
import { EncryptionService } from './encryption/encryption.service';

@Module({
  controllers: [StorageController],
  imports: [AuthModule, FeedModule, MailerModule, CallerModule, SocialModule],
  providers: [
    UtilityService,
    ApolloService,
    QueueService,
    CacheService,
    StorageService,
    ShutdownService,
    MediaService,
    MediaInfrastructure,
  ],
  exports: [UtilityService, CacheService, ShutdownService, StorageService],
})
export class UtilityModule {}
