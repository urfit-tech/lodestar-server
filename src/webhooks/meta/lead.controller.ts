import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APIException } from '~/api.excetion';
import { LeadWebhookBody } from './lead.dto';
import { LeadService } from './lead.service';

@Controller({
  path: 'webhooks/meta/lead',
})
export class LeadController {
  constructor(
    private readonly configService: ConfigService<{ META_VERIFY_TOKEN: string }>,
    private readonly leadService: LeadService,
  ) {}

  @Get(':appId')
  async verify(
    @Query('hub.mode') mode: string,
    @Query('hub.challenge') challenge: string,
    @Query('hub.verify_token') verifyToken: string,
  ) {
    if (verifyToken !== this.configService.get('META_VERIFY_TOKEN')) {
      throw new APIException(
        {
          code: 'E_META_VERIFY',
          message: 'invalid verify token',
          result: { mode, challenge, verifyToken },
        },
        400,
      );
    }

    return challenge;
  }

  @Post(':appId')
  async webhook(@Param('appId') appId: string, @Body() body: LeadWebhookBody) {
    this.leadService.storeLead(appId, body);
  }
}
