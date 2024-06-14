import { Controller, Get, Param, Res, Query } from '@nestjs/common';
import { Response } from 'express';
import { CoinService } from './coin.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Coin')
@Controller({
  path: 'coins',
  version: '2',
})
export class CoinController {
  constructor(private readonly coinService: CoinService) {}

  @Get(':coinId/claim')
  public async claimCoin(@Param('coinId') coinId: string, @Query('memberId') memberId: string, @Res() res: Response) {
    try {
      const { success, message } = await this.coinService.claimCoin(coinId, memberId);
      return res.send(` <html>
          <body>
            <script>
              alert('${message}');
              window.close();
            </script>
          </body>
        </html>`);
    } catch (error) {
      console.log(error);
      return res.send(` <html>
          <body>
            <script>
              alert('${error.message}');
              window.close();
            </script>
          </body>
        </html>`);
    }
  }
}
