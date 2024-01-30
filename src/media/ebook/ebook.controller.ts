import { Body, Controller, Get, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../auth/auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { APIException } from '~/api.excetion';

import { Local } from '~/decorator';
import { JwtMember } from '~/auth/auth.dto';
import { EbookService, StandardEbookService, TrialEbookService } from './ebook.service';
import { Request, Response } from 'express';
import { Readable } from 'node:stream';
import { EbookEncryptionError, EbookFileRetrievalError, KeyAndIVRetrievalError } from './ebook.errors';
import { ProgramService } from '~/program/program.service';

@ApiTags('Ebook')
@ApiBearerAuth()
@Controller()
export class EbookController {
  constructor(
    private readonly standardEbookService: StandardEbookService, 
    private readonly trialEbookService: TrialEbookService,
    private readonly programService: ProgramService
  ) {}
  
  @UseGuards(AuthGuard)
  @Get('ebook/:programContentId')
  public async getStandardEbook(
    @Param('programContentId') programContentId: string,
    @Local('member') member: JwtMember,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    console.log('programContentId',programContentId)
    await this.processGetEbook(this.standardEbookService, member.appId, programContentId, req, res);
  }

  @Get('ebook/trial/:programContentId')
  public async getTrialEbook(
    @Param('programContentId') programContentId: string,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    const [contentId, ..._] = programContentId.split(".");
    const programContents = await this.programService.getProgramContentById(contentId);
    if (programContents?.displayMode === 'trial') {
      await this.processGetEbook(this.trialEbookService, 'trial', programContentId, req, res);
    }else {
      throw new APIException({ code: 'E_UNAUTORIZE', message: 'unautorize to get ebook' }, 401);
    }
  }

  private async processGetEbook(
    ebookService: EbookService,
    appId: string,
    programContentId: string,
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const encryptedFileStream = await ebookService.processEbook(appId, programContentId, req);

      res.setHeader('Content-Type', 'application/epub+zip');
      res.setHeader('Content-Disposition', `attachment; filename="${programContentId}.epub"`);
      encryptedFileStream.pipe(res);
    } catch (error) {
      if (error instanceof EbookFileRetrievalError) {
        throw new APIException({ code: 'E_EBOOK_FILE_RETRIEVAL', message: error.message }, 400);
      } else if (error instanceof KeyAndIVRetrievalError) {
        throw new APIException({ code: 'E_KEY_IV_RETRIEVAL', message: error.message }, 400);
      } else if (error instanceof EbookEncryptionError) {
        throw new APIException({ code: 'E_EBOOK_ENCRYPTION', message: error.message }, 400);
      } else {
        throw new APIException({ code: 'E_UNKNOWN', message: 'Unknown error' }, 500);
      }
    }
  }

}