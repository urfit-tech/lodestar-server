import { Body, Controller, Get, Param, Post, Req, Res, UseGuards, Headers, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '../../auth/auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { APIException } from '~/api.excetion';
import { Local } from '~/decorator';
import { JwtMember } from '~/auth/auth.dto';
import { EbookService } from './ebook.service';
import { Request, Response } from 'express';
import { Readable } from 'node:stream';
import { EbookEncryptionError, EbookFileRetrievalError, KeyAndIVRetrievalError } from './ebook.errors';
import { ProgramService } from '~/program/program.service';
import { AuthService } from '~/auth/auth.service';

@ApiTags('Ebook')
@ApiBearerAuth()
@Controller({
  path: 'ebook',
  version: '2',
})
export class EbookController {
  constructor(
    private readonly ebookService: EbookService, 
    private readonly programService: ProgramService,
    private readonly authService: AuthService
  ) {}

  @Get(':programContentId')
  public async getStandardEbook(
    @Param('programContentId') programContentId: string,
    @Headers('Authorization') authorization: string,
    @Local('member') member: JwtMember,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    try {
      const [contentId, ..._] = programContentId.split(".");
      const programContents = await this.programService.getProgramContentById(contentId);

      const isTrial = programContents?.displayMode === 'trial';
      const appId = isTrial ? 'trial' : this.extractAppId(authorization);

      await this.processGetEbook(appId, programContentId, req, res, isTrial);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private extractAppId(authorization: string): string {
    const token = authorization.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException();
    }
    return this.authService.verify(token).appId;
  }

  private async processGetEbook(
    appId: string,
    programContentId: string,
    req: Request,
    res: Response,
    isTrial: boolean
  ): Promise<void> {
    const encryptedFileStream = await this.ebookService.processEbook(appId, programContentId, req, isTrial);

    res.setHeader('Content-Type', 'application/epub+zip');
    res.setHeader('Content-Disposition', `attachment; filename="${programContentId}.epub"`);
    encryptedFileStream.pipe(res);
  }

  private handleError(error: any, res: Response): void {
    if (error instanceof EbookFileRetrievalError || error instanceof KeyAndIVRetrievalError || error instanceof EbookEncryptionError) {
      throw new APIException({ code: `E_${error.name.toUpperCase()}`, message: error.message }, 400);
    } else if (error instanceof UnauthorizedException) {
      throw error;
    } else {
      throw new APIException({ code: 'E_UNKNOWN', message: 'Unknown error' }, 500);
    }
  }
}
