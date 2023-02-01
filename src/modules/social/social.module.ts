import { Module } from '@nestjs/common'
import { FacebookService } from './facebook/facebook.service'
import { LineService } from './line/line.service'

@Module({
  providers: [LineService, FacebookService],
})
export class SocialModule {}
