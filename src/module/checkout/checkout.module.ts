import { Module } from '@nestjs/common'
import { DiscountModule } from '~/module/discount/discount.module'
import { InvoiceModule } from '~/module/invoice/invoice.module'
import { OrderModule } from '~/module/order/order.module'
import { PaymentModule } from '~/module/payment/payment.module'
import { ProductModule } from '~/module/product/product.module'

@Module({
  imports: [ProductModule, DiscountModule, PaymentModule, OrderModule, InvoiceModule],
})
export class CheckoutModule {}
