import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';

@Controller({
  path: 'webhooks/meta/lead',
})
export class LeadController {
  constructor() {}

  @Get()
  async ping(@Req() request: Request) {
    console.log('pong');
    return 'pong';
  }
}
