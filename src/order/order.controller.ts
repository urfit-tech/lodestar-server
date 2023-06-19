import { Body, Controller, Headers, Put } from '@nestjs/common';
import { verify } from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { APIException } from '~/api.excetion';
import { OrderService } from './order.service';
import { TransferReceivedOrderBodyDTO, TransferReceivedOrderDTO, TransferReceivedOrderToken } from './order.type';

@Controller({
  path: 'orders',
  version: ['2'],
})
export class OrderController {
  constructor(
    private orderService: OrderService,
    private readonly configService: ConfigService<{ HASURA_JWT_SECRET: string }>,
  ) {}

  @Put('transfer-received-order')
  async transferOrder(@Body() dto: TransferReceivedOrderBodyDTO, @Headers() headers) {
    const { token, memberId } = dto;
    let transferOrderToken;

    try {
      const { authorization } = headers;
      await verify(authorization.split(' ')[1], this.configService.get('HASURA_JWT_SECRET'));
    } catch {
      throw new APIException({ code: 'E_TOKEN_INVALID', message: 'authToken is invalid' });
    }

    try {
      transferOrderToken = (await verify(
        token,
        this.configService.get('HASURA_JWT_SECRET'),
      )) as TransferReceivedOrderToken;
    } catch {
      throw new APIException({ code: 'E_TOKEN_INVALID', message: 'transferOrderToken is invalid' });
    }

    const { orderLogId } = transferOrderToken;
    const transferOrderDTO: TransferReceivedOrderDTO = { memberId, orderId: orderLogId };
    const updateResult = await this.orderService.transferReceivedOrder(transferOrderDTO);

    return { code: 'SUCCESS', message: updateResult };
  }
}
