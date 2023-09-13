import { Body, Controller, Post } from '@nestjs/common';

import { AppCache } from '~/app/app.type';
import { Local } from '~/decorator';

import { AuthService } from './auth.service';
import { CrossServerTokenDTO } from './auth.type';

@Controller({
  path: 'auth',
  version: ['2'],
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('token')
  async generateCrossServerToken(
    @Local('appCache') appCache: AppCache,
    @Body() body: CrossServerTokenDTO,
  ) {
    const authToken = await this.authService.generateCrossServerToken(appCache, body);
    return {
      code: 'SUCCESS',
      message: 'get auth token successfully',
      result: { authToken },
    };
  }
}
