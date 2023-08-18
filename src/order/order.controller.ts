import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';

import { AuthGuard } from '~/auth/auth.guard';
import { APIException } from '~/api.excetion';

import { OrderService } from './order.service';
import { TransferReceivedOrderBodyDTO, TransferReceivedOrderDTO, TransferReceivedOrderToken } from './order.type';
import { AuthService } from '~/auth/auth.service';

@UseGuards(AuthGuard)
@Controller({
  path: 'orders',
  version: ['2'],
})
export class OrderController {
  constructor(private authService: AuthService, private orderService: OrderService) {}

  @Put('transfer-received-order')
  async transferOrder(@Body() dto: TransferReceivedOrderBodyDTO) {
    const { token, memberId } = dto;
    let transferOrderToken;

    try {
      transferOrderToken = this.authService.verify(token) as TransferReceivedOrderToken;
    } catch {
      throw new APIException({ code: 'E_TOKEN_INVALID', message: 'transferOrderToken is invalid' });
    }

    const { orderLogId } = transferOrderToken;
    const transferOrderDTO: TransferReceivedOrderDTO = { memberId, orderId: orderLogId };
    const updateResult = await this.orderService.transferReceivedOrder(transferOrderDTO);

    return { code: 'SUCCESS', message: 'transfer order successfully', result: updateResult };
  }

  @Get(':orderId')
  async getOrderById(@Param('orderId') orderId: string) {
    if (!orderId) {
      throw new APIException({ code: 'E_NULL_ORDER', message: 'orderId is null or undefined' });
    }

    const order = await this.orderService.getOrderById(orderId);
    return { code: 'SUCCESS', message: 'Get order successfully.', result: order };
  }
}
