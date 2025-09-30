import { Controller, Get, Injectable } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { JwtMember } from '~/auth/auth.dto';
import { Local } from '~/decorator';
import { CardResponseDTO } from './card.dto';

@ApiTags('Card')
@Controller({
  path: 'membership-cards',
  version: ['2'],
})
export class CardController {
  constructor(private readonly logger: Logger) {}

  @Get()
  getMembershipCards(@Local('member') member: JwtMember): Promise<CardResponseDTO[]> {
    this.logger.log('Fetching membership cards');
    // get 
    return [];
  }
}
