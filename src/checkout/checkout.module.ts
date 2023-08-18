import { Module } from '@nestjs/common';
import { DiscountModule } from '~/discount/discount.module';
import { InvoiceModule } from '~/invoice/invoice.module';
import { OrderModule } from '~/order/order.module';
import { PaymentModule } from '~/payment/payment.module';
import { ProductModule } from '~/product/product.module';

@Module({
  imports: [ProductModule, DiscountModule, PaymentModule, OrderModule, InvoiceModule],
})
export class CheckoutModule {}
