import { Module } from '@nestjs/common'
import { SocialModule } from '~/social/social.module'
import { CallerModule } from '../caller/caller.module'
import { FeedModule } from '../feed/feed.module'
import { MailerModule } from '../mailer/mailer.module'
import { MediaModule } from '../media/media.module'
import { ApolloService } from './apollo/apollo.service'
import { CacheService } from './cache/cache.service'
import { QueueService } from './queue/queue.service'
import { StorageService } from './storage/storage.service'
import { UtilityService } from './utility.service'

@Module({
  imports: [FeedModule, MediaModule, MailerModule, CallerModule, SocialModule],
  providers: [UtilityService, ApolloService, QueueService, CacheService, StorageService],
  exports: [UtilityService, CacheService],
})
export class UtilityModule {}
