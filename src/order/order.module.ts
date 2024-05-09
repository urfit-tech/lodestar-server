import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';

import { AuthModule } from '~/auth/auth.module';
import { CouponModule } from '~/coupon/coupon.module';
import { PaymentModule } from '~/payment/payment.module';
import { ProductModule } from '~/product/product.module';
import { SharingCodeModule } from '~/sharingCode/sharingCode.module';
import { ExporterTasker } from '~/tasker/exporter.tasker';
import { VoucherModule } from '~/voucher/voucher.module';

import { OrderController } from './order.controller';
import { OrderInfrastructure } from './order.infra';
import { OrderService } from './order.service';
import { AccessControlService } from '~/auth/access-control.service';

@Module({
  controllers: [OrderController],
  imports: [
    AuthModule,
    CouponModule,
    PaymentModule,
    BullModule.registerQueue({ name: ExporterTasker.name }),
    SharingCodeModule,
    ProductModule,
    VoucherModule,
  ],
  exports: [OrderInfrastructure],
  providers: [OrderService, OrderInfrastructure,AccessControlService,],
})
export class OrderModule {}
