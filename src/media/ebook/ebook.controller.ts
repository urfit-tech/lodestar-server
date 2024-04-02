import { Controller, Get, Param, Req, Res, Headers, UnauthorizedException } from '@nestjs/common';
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
    @Req() req: Request,
    @Res() res: Response,
    @Headers('Authorization') authorization?: string
  ): Promise<void> {
    const contentId = programContentId.split(".")[0];
    let programContents;

    try {
      programContents = await this.programService.getProgramContentById(contentId);
    } catch (err) {
      throw new APIException({ code: 'E_EBOOK_NOT_FOUND', message: 'Unable to retrieve ebook file' }, 400)
    }

    const isTrial = !authorization && programContents.displayMode === 'trial';
    const appId = programContents.contentSection.program.appId;

    if (authorization) {
      this.verifyAuthorization(authorization);
    } else if (!isTrial) {
      throw new UnauthorizedException();
    }

    try {
      const encryptedFileStream = await this.ebookService.processEbook(appId, programContentId, req, isTrial);

      res.setHeader('Content-Type', 'application/epub+zip');
      res.setHeader('Content-Disposition', `attachment; filename="${programContentId}.epub"`);

      encryptedFileStream.pipe(res);

    } catch(error) {
      this.handleError(error, res);
    }
  }

  private verifyAuthorization(authorization: string) {
    const token = authorization.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }
    
    try {
      const verifiedToken = this.authService.verify(token);
      if (!verifiedToken) {
        throw new UnauthorizedException('Invalid or expired token');
      }
      return verifiedToken;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }


  private handleError(error: any, res: Response): void {
    if (error instanceof EbookFileRetrievalError || error instanceof KeyAndIVRetrievalError || error instanceof EbookEncryptionError) {
      res.status(400).json(new APIException({ code: `E_${error.name.toUpperCase()}`, message: error.message }));
    } else {
      res.status(500).json(new APIException({ code: 'E_UNKNOWN', message: 'Unknown error' }));
    }
  }
}
