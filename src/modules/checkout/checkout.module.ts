import { Module } from '@nestjs/common'
import { DiscountModule } from '~/modules/discount/discount.module'
import { InvoiceModule } from '~/modules/invoice/invoice.module'
import { OrderModule } from '~/modules/order/order.module'
import { PaymentModule } from '~/modules/payment/payment.module'
import { ProductModule } from '~/modules/product/product.module'

@Module({
  imports: [ProductModule, DiscountModule, PaymentModule, OrderModule, InvoiceModule],
})
export class CheckoutModule {}
