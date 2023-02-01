import { Module } from '@nestjs/common'
import { RssService } from './rss/rss.service'

@Module({
  providers: [RssService],
})
export class FeedModule {}
