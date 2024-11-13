import { Module } from '@nestjs/common';
import { CoinController } from './coin.controller';
import { CoinInfrastructure } from './coin.infra';
import { CoinService } from './coin.service';

@Module({
  controllers: [CoinController],
  imports: [],
  providers: [CoinInfrastructure, CoinService],
  exports: [],
})
export class CoinModule {}
