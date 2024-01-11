import { Body, Controller, Get, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../auth/auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { EbookRequestDTO } from './ebook.dto';
import { APIException } from '~/api.excetion';

import { Local } from '~/decorator';
import { JwtMember } from '~/auth/auth.dto';
import { EbookService } from './ebook.service';
import { Request, Response } from 'express';
import { Readable } from 'node:stream';

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
    @Req() req: Request,
    @Res() res: Response,
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

    const fileStream = await this.ebookService.getEbookFile(appId, programContentId);

    const encryptedFileStream = await this.ebookService.encryptEbook(req, fileStream as Readable);

    res.setHeader('Content-Type', 'application/epub+zip');
    res.setHeader('Content-Disposition', 'attachment; filename="' + programContentId + '.epub"');

    (encryptedFileStream as Readable).pipe(res);
  }
}
