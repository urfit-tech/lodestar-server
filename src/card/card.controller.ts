import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { JwtMember } from '~/auth/auth.dto';
import { AuthGuard } from '~/auth/auth.guard';
import { Local } from '~/decorator';
import { CardResponseDTO } from './dto/card-response.dto';
import { CardService } from './card.service';

@ApiTags('Card')
@Controller({
  path: 'membership-cards',
  version: ['2'],
})
export class CardController {
  constructor(private readonly logger: Logger, private readonly cardService: CardService) {}

  @UseGuards(AuthGuard)
  @Get()
  async findAll(@Local('member') member: JwtMember): Promise<CardResponseDTO[]> {
    this.logger.log(`Fetching membership cards,${member.appId}`);
    return await this.cardService.findAllByApp(member.appId);
  }
}
