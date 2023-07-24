import { Body, Controller, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { MediaService } from './media.service';

@Controller({
  path: 'media',
  version: ['2'],
})
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('/sign-cookies') signCookie(@Res() res: Response, @Body() body: { url: string }) {
    const cookies = this.mediaService.signCookies(body.url);
    res.cookie('CloudFront-Expires', cookies['CloudFront-Expires']);
    res.cookie('CloudFront-Key-Pair-Id', cookies['CloudFront-Key-Pair-Id']);
    res.cookie('CloudFront-Signature', cookies['CloudFront-Signature']);
    res.send('success set cookie');
  }
}
