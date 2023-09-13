import { Controller, Get } from '@nestjs/common';

import { Local } from '~/decorator';

import { AppCache } from './app.type';

@Controller({
  path: 'app',
  version: ['2'],
})
export class AppController {
  @Get()
  async getInfo(
    @Local('appCache') appCache: AppCache,
  ) {
    const { id: appId } = appCache;
    return appId;
  }
}
