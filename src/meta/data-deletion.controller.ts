import { Body, Controller, Get, Post, Query, HttpCode, HttpStatus } from '@nestjs/common';
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
  async dataDeletionCallback(@Body() body: DataDeletionRequestDto) {
    try {
      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * GET /v2/meta/data-deletion/status?id={confirmation_code}
   */
  @Get('status')
  async dataDeletionStatus(@Query('id') confirmationCode: string) {
    return true;
  }
}
