import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../auth/auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { EbookRequestDTO } from './ebook.dto';
import { APIException } from '~/api.excetion';

import { Local } from '~/decorator';
import { JwtMember } from '~/auth/auth.dto';
import { EbookService } from './ebook.service';

@UseGuards(AuthGuard)
@ApiTags('Ebook')
@ApiBearerAuth()
@Controller({
  path: 'ebook',
  version: '2',
})
export class EbookController {
  constructor(private readonly ebookService: EbookService) {}

  @Get(':programContentId')
  @ApiBearerAuth()
  public async getEbookByProgramContentId(
    @Param('programContentId') programContentId: string,
    @Local('member') member: JwtMember,
  ): Promise<any> {
    const { appId } = member;

    const errors = [];

    if (!appId || typeof appId !== 'string' || appId.trim() === '') {
      errors.push('appId must be a string and cannot be empty');
    }
    if (errors.length > 0) {
      throw new APIException(
        { code: 'EbookByProgramContentId_Error', message: 'Invalid request parameters', result: errors },
        400,
      );
    }

    return this.ebookService.getEbookFileSignedUrl(appId, programContentId);
  }
}
