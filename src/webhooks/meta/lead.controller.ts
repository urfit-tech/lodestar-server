import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APIException } from '~/api.excetion';
import { LeadWebhookBody } from './lead.dto';
import { LeadService } from './lead.service';
import { AppService } from '~/app/app.service';
import { AppCache } from '~/app/app.type';

@Controller({
  path: 'webhooks/meta/lead',
})
export class LeadController {
  constructor(
    private readonly configService: ConfigService<{ META_VERIFY_TOKEN: string }>,
    private readonly leadService: LeadService,
    private readonly appService: AppService,
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
  @HttpCode(HttpStatus.NO_CONTENT)
  async webhook(@Param('appId') appId: string, @Body() body: LeadWebhookBody) {
    let app: AppCache;
    try {
      app = await this.appService.getAppInfo(appId);
    } catch (error) {
      throw new APIException(
        {
          code: 'E_APP_NOT_FOUND',
          message: 'app not found',
          result: { appId },
        },
        404,
      );
    }

    await this.leadService.storeLead(app, body);
  }
}
