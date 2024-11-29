import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { AuthModule } from '~/auth/auth.module';
import { MemberModule } from '~/member/member.module';
import { ImporterTasker } from '~/tasker/importer.tasker';
import { CoinController } from './coin.controller';
import { CoinService } from './coin.service';

@Module({
  controllers: [CoinController],
  imports: [AuthModule, MemberModule, BullModule.registerQueue({ name: ImporterTasker.name })],
  providers: [CoinService],
  exports: [],
})
export class CoinModule {}
