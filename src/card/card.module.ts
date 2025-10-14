import { Module } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { AuthModule } from '~/auth/auth.module';
import { CardController } from './card.controller';
import { CardInfrastructure } from './card.infra';
import { CardRepository } from './card.repository';
import { CardService } from './card.service';

@Module({
  controllers: [CardController],
  providers: [
    Logger,
    CardService,
    {
      provide: CardRepository,
      useClass: CardInfrastructure,
    },
  ],
  imports: [AuthModule],
  exports: [CardService],
})
export class CardModule {}
