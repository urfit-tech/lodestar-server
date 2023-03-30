import { Body, Controller, Post } from "@nestjs/common";

import { AuthService } from "./auth.service";
import { CrossServerTokenDTO } from "./auth.type";

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('token')
  async generateCrossServerToken(
    @Body() body: CrossServerTokenDTO,
  ) {
    const authToken = await this.authService.generateCrossServerToken(body);
    return {
      code: 'SUCCESS',
      message: 'get auth token successfully',
      result: { authToken },
    };
  }
}