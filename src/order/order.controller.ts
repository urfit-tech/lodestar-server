import { Body, Controller, Get, Param, Post, Put, UseGuards, Request } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { AuthGuard } from '~/auth/auth.guard';
import { AuthService } from '~/auth/auth.service';
import { APIException } from '~/api.excetion';
import { OrderService } from './order.service';
import { TransferReceivedOrderToken } from './order.type';
import { TransferReceivedOrderBodyDTO, TransferReceivedOrderDTO, OrderExportDTO } from './order.dto';
import {
  OrderLogExportJob,
  ExporterTasker,
  OrderProductExportJob,
  OrderDiscountExportJob,
} from '~/tasker/exporter.tasker';
import { Queue } from 'bull';
import { Local } from '~/decorator';
import { JwtMember } from '~/auth/auth.dto';

@UseGuards(AuthGuard)
@Controller({
  path: 'orders',
  version: '2',
})
export class OrderController {
  constructor(
    private authService: AuthService,
    private orderService: OrderService,
    @InjectQueue(ExporterTasker.name) private readonly exportQueue: Queue,
  ) {}

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

  @Post('export')
  public async exportOrderLogs(@Local('member') member: JwtMember, @Body() metadata: OrderExportDTO): Promise<void> {
    const { appId, memberId: invokerMemberId } = member;

    const { exportMime, ...conditions } = metadata;
    const exportJob: OrderLogExportJob = {
      appId,
      invokerMemberId: invokerMemberId,
      category: 'orderLog',
      conditions,
      exportMime,
    };
    await this.exportQueue.add(exportJob, { removeOnComplete: true, removeOnFail: true });
  }

  @Post('export/products')
  public async exportOrderProducts(
    @Local('member') member: JwtMember,
    @Body() metadata: OrderExportDTO,
  ): Promise<void> {
    const { appId, memberId: invokerMemberId } = member;
    const { exportMime, ...conditions } = metadata;
    const exportJob: OrderProductExportJob = {
      appId,
      invokerMemberId: invokerMemberId,
      category: 'orderProduct',
      conditions,
      exportMime,
    };
    await this.exportQueue.add(exportJob, { removeOnComplete: true, removeOnFail: true });
  }

  @Post('export/discounts')
  public async exportOrderDiscounts(
    @Local('member') member: JwtMember,
    @Body() metadata: OrderExportDTO,
  ): Promise<void> {
    const { appId, memberId: invokerMemberId } = member;
    const { exportMime, ...conditions } = metadata;
    const exportJob: OrderDiscountExportJob = {
      appId,
      invokerMemberId: invokerMemberId,
      category: 'orderDiscount',
      conditions,
      exportMime,
    };
    await this.exportQueue.add(exportJob, { removeOnComplete: true, removeOnFail: true });
  }
}
