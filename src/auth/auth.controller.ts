import { Body, Controller, Logger, Post } from '@nestjs/common';

import { AuthService } from './auth.service';
import { CrossServerTokenDTO, GenerateTmpPasswordDto } from './auth.type';

@Controller({
  path: 'auth',
  version: ['2'],
})
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly logger: Logger) {}

  @Post('token')
  async generateCrossServerToken(@Body() body: CrossServerTokenDTO) {
    const authToken = await this.authService.generateCrossServerToken(body);
    return {
      code: 'SUCCESS',
      message: 'get auth token successfully',
      result: { authToken },
    };
  }

  @Post('password/temporary')
  async generateTmpPassword(@Body() body: GenerateTmpPasswordDto) {
    try {
      const { appId, account, email, purpose } = body;
      const result = await this.authService.generateTmpPassword(appId, email);

      await this.authService.insertAuditLog(appId, account, email, purpose);
      return {
        code: 'SUCCESS',
        message: 'get temporary password successfully',
        result,
      };
    } catch (err) {
      this.logger.error(err);
      return {
        code: 'E_TMP_PASSWORD',
        message: 'failed to generate temporary password',
        result: null,
      };
    }
  }
}
