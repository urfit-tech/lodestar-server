import { Body, Controller, Get, Param, Post, Put, UseGuards, Request } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bull';
import { EntityManager } from 'typeorm';
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
import { Permissions } from '~/decorators/permissions.decorator';
import { PermissionSet } from '~/enums/PermissionSet.enum';
import { PermissionGuard } from '~/auth/permission.guard';
import { isAppOwnerOrHasAnyPermission } from '~/auth/authorization.helper';
import { EXPORT_JOB_TIMEOUT_MS } from './order.export.constants';

const ORDER_PERMISSION_GROUP_ADMIN: PermissionSet[] = [
  PermissionSet.SALES_RECORDS_NORMAL,
  PermissionSet.SALES_RECORDS_ADMIN,
];

// An order is readable by its buyer, or by the same app's owner / sales-records staff.
export const canReadOrder = (
  member: JwtMember | undefined,
  order: { appId?: string | null; memberId?: string | null } | undefined | null,
): boolean => {
  if (!member || !order || !member.appId || order.appId !== member.appId) {
    return false;
  }
  if (member.memberId && order.memberId === member.memberId) {
    return true;
  }
  return isAppOwnerOrHasAnyPermission(member, ORDER_PERMISSION_GROUP_ADMIN);
};

// Group-buying gift: the sub order's options.emailedNonSiteMemberEmail.email is the address the buyer invited
// (storefront GroupBuyingCollectionPage reads it from order_group_buying_log.options = the sub order's options).
export const isInvitedGroupBuyingReceiver = (
  member: JwtMember | undefined,
  order: { appId?: string | null; options?: unknown } | undefined | null,
): boolean => {
  if (!member || !order || !member.appId || order.appId !== member.appId) {
    return false;
  }
  const invitedEmail = (order.options as { emailedNonSiteMemberEmail?: { email?: unknown } } | null)
    ?.emailedNonSiteMemberEmail?.email;
  const callerEmail = member.email;
  if (typeof invitedEmail !== 'string' || typeof callerEmail !== 'string') {
    return false;
  }
  const normalized = invitedEmail.trim().toLowerCase();
  return normalized !== '' && normalized === callerEmail.trim().toLowerCase();
};

// What the invited receiver gets: only the fields GroupBuyingReceivedPage uses (transferredAt; memberId is
// compared with the caller, and once the gift is claimed the receiver is the order member and reads it in full).
export const toGroupBuyingReceiverView = (order: { id: string; transferredAt?: Date | null }) => ({
  id: order.id,
  transferredAt: order.transferredAt ?? null,
});

@UseGuards(AuthGuard, PermissionGuard)
@Controller({
  path: 'orders',
  version: '2',
})
export class OrderController {
  constructor(
    private authService: AuthService,
    private orderService: OrderService,
    @InjectQueue(ExporterTasker.name) private readonly exportQueue: Queue,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}

  @Put('transfer-received-order')
  async transferOrder(@Local('member') member: JwtMember, @Body() dto: TransferReceivedOrderBodyDTO) {
    // The body memberId is ignored: the gift always goes to the caller.
    const { token } = dto;
    let transferOrderToken;

    try {
      transferOrderToken = this.authService.verify(token) as TransferReceivedOrderToken;
    } catch {
      throw new APIException({ code: 'E_TOKEN_INVALID', message: 'transferOrderToken is invalid' });
    }

    const { orderLogId } = transferOrderToken;
    if (!orderLogId || typeof orderLogId !== 'string') {
      throw new APIException({ code: 'E_TOKEN_INVALID', message: 'transferOrderToken is invalid' });
    }
    // Only within the caller's app, and only once (the receiver page used to hide the button after a transfer).
    const order = await this.orderService.getOrderById(orderLogId);
    if (!member?.memberId || order.appId !== member.appId) {
      throw new APIException({ code: 'E_DB_GET_ORDER_NOT_FOUND', message: 'order not found.' });
    }
    if (order.transferredAt) {
      throw new APIException({ code: 'E_ORDER_ALREADY_TRANSFERRED', message: 'order has already been transferred' });
    }
    const transferOrderDTO: TransferReceivedOrderDTO = { memberId: member.memberId, orderId: orderLogId };
    const updateResult = await this.orderService.transferReceivedOrder(
      transferOrderDTO,
      this.entityManager,
      member.memberId,
    );

    return { code: 'SUCCESS', message: 'transfer order successfully', result: updateResult };
  }

  @Get(':orderId')
  async getOrderById(@Local('member') member: JwtMember, @Param('orderId') orderId: string) {
    if (!orderId) {
      throw new APIException({ code: 'E_NULL_ORDER', message: 'orderId is null or undefined' });
    }

    const order = await this.orderService.getOrderById(orderId);
    if (canReadOrder(member, order)) {
      return { code: 'SUCCESS', message: 'Get order successfully.', result: order };
    }
    if (isInvitedGroupBuyingReceiver(member, order)) {
      return { code: 'SUCCESS', message: 'Get order successfully.', result: toGroupBuyingReceiverView(order) };
    }
    // Same response as a missing order, so callers cannot probe other members' or tenants' order ids.
    throw new APIException({ code: 'E_DB_GET_ORDER_NOT_FOUND', message: 'order not found.' });
  }

  @Post('export')
  @Permissions(...ORDER_PERMISSION_GROUP_ADMIN)
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
    await this.exportQueue.add(exportJob, {
      removeOnComplete: true,
      removeOnFail: true,
      timeout: EXPORT_JOB_TIMEOUT_MS,
    });
  }

  @Post('export/products')
  @Permissions(...ORDER_PERMISSION_GROUP_ADMIN)
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
    await this.exportQueue.add(exportJob, {
      removeOnComplete: true,
      removeOnFail: true,
      timeout: EXPORT_JOB_TIMEOUT_MS,
    });
  }

  @Post('export/discounts')
  @Permissions(...ORDER_PERMISSION_GROUP_ADMIN)
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
    await this.exportQueue.add(exportJob, {
      removeOnComplete: true,
      removeOnFail: true,
      timeout: EXPORT_JOB_TIMEOUT_MS,
    });
  }
}
