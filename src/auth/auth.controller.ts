import { Body, Controller, Post } from "@nestjs/common";

import { CrossServerTokenDTO } from "./auth.type";

@Controller('auth')
export class AuthController {
  @Post('token')
  async generateCrossServerToken(
    @Body() body: CrossServerTokenDTO,
  ) {
    const authToken = '';
    return {
      code: 'SUCCESS',
      message: 'get auth token successfully',
      result: { authToken },
    };
  }
}