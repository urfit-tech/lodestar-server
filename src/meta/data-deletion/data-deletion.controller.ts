import { Body, Controller, Get, Post, Query, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { Request } from 'express';
import { randomUUID } from 'crypto';
import { DataDeletionRequestDto } from './data-deletion.dto';

@Controller({
  path: 'meta/data-deletion',
  version: '2',
})
export class DataDeletionController {
  /**
   * POST /v2/meta/data-deletion
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  async dataDeletionCallback(@Body() body: DataDeletionRequestDto, @Req() req: Request) {
    const confirmationCode = randomUUID();
    const host = req.get('host');
    const protocol = req.protocol;
    const statusUrl = `${protocol}://${host}/api/v2/meta/data-deletion/status?id=${confirmationCode}`;

    return {
      url: statusUrl,
      confirmation_code: confirmationCode,
    };
  }

  /**
   * GET /v2/meta/data-deletion/status?id={confirmation_code}
   */
  @Get('status')
  async dataDeletionStatus(@Query('id') confirmationCode: string) {
    return {
      status: 'completed',
      confirmation_code: confirmationCode,
    };
  }
}
