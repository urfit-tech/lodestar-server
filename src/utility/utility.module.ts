import { Module } from '@nestjs/common'
import { SocialModule } from '~/module/social/social.module'
import { CallerModule } from '../module/caller/caller.module'
import { FeedModule } from '../module/feed/feed.module'
import { MailerModule } from '../module/mailer/mailer.module'
import { MediaModule } from '../module/media/media.module'
import { ApolloService } from './apollo/apollo.service'
import { CacheService } from './cache/cache.service'
import { QueueService } from './queue/queue.service'
import { StorageService } from './storage/storage.service'
import { UtilityService } from './utility.service'

@Module({
  imports: [FeedModule, MediaModule, MailerModule, CallerModule, SocialModule],
  providers: [UtilityService, ApolloService, QueueService, CacheService, StorageService],
})
export class UtilityModule {}
