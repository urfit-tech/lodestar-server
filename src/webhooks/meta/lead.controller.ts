import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Param, Post, Query, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APIException } from '~/api.excetion';
import { LeadWebhookBody } from './lead.dto';
import { LeadService } from './lead.service';
import { AppService } from '~/app/app.service';
import { AppCache } from '~/app/app.type';
import { isValidMetaSignature, RequestWithRawBody } from '../webhook-signature';

// app_secret key for a per-app Meta app secret; META_APP_SECRET (env) is used when the app has none.
export const META_APP_SECRET_KEY = 'meta.app_secret';

@Controller({
  path: 'webhooks/meta/lead',
  version: '2',
})
export class LeadController {
  constructor(
    private readonly configService: ConfigService<{ META_VERIFY_TOKEN: string; META_APP_SECRET: string }>,
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
  async webhook(
    @Param('appId') appId: string,
    @Body() body: LeadWebhookBody,
    @Req() request: RequestWithRawBody,
    @Headers('x-hub-signature-256') signature?: string,
  ) {
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

    // Fails closed: without a configured secret every request is refused.
    const appSecret = app.secrets?.[META_APP_SECRET_KEY] || this.configService.get('META_APP_SECRET');
    if (!isValidMetaSignature(request.rawBody, signature, appSecret)) {
      throw new APIException({ code: 'E_META_SIGNATURE', message: 'invalid or missing X-Hub-Signature-256' }, 401);
    }

    await this.leadService.storeLead(app, body);
  }
}
