import { Body, Controller, Headers, Put } from '@nestjs/common';
import { verify } from 'jsonwebtoken';
import { APIException } from '~/api.excetion';
import { OrderService } from './order.service';
import { TransferReceivedOrderBodyDTO, TransferReceivedOrderDTO, TransferReceivedOrderToken } from './order.type';

@Controller('order')
export class OrderController {
  constructor(private orderService: OrderService) {}

  @Put('transfer-received-order')
  async transferOrder(@Body() dto: TransferReceivedOrderBodyDTO, @Headers() headers) {
    const { token, memberId } = dto;
    let transferOrderToken;

    try {
      const { authorization } = headers;
      await verify(authorization.split(' ')[1], process.env.HASURA_JWT_SECRET);
    } catch {
      throw new APIException({ code: 'E_TOKEN_INVALID', message: 'authToken is invalid' });
    }

    try {
      transferOrderToken = (await verify(token, process.env.HASURA_JWT_SECRET)) as TransferReceivedOrderToken;
    } catch {
      throw new APIException({ code: 'E_TOKEN_INVALID', message: 'transferOrderToken is invalid' });
    }

    const { orderLogId } = transferOrderToken;
    const transferOrderDTO: TransferReceivedOrderDTO = { memberId, orderId: orderLogId };
    const updateResult = await this.orderService.transferReceivedOrder(transferOrderDTO);

    return { code: 'SUCCESS', message: updateResult };
  }
}
