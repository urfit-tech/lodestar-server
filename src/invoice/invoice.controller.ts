import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { AuthGuard } from '~/auth/auth.guard';
import { PaymentService } from '~/payment/payment.service';
import { IssueInvoiceBodyDTO } from './invoice.dto';
import { InvoiceService } from './invoice.service';

@UseGuards(AuthGuard)
@Controller({
  path: 'invoice',
  version: '2',
})
export class InvoiceController {
  constructor(
    private readonly invoiceService: InvoiceService,
    private readonly paymentService: PaymentService,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}

  @Post('issue')
  async issueInvoice(@Body() dto: IssueInvoiceBodyDTO) {
    const { paymentNo } = dto;

    const payment = await this.paymentService.getPaymentByNo(paymentNo, this.entityManager);

    if (!payment) {
      return { code: 'ERROR_NO_PAYMENT', message: 'payment not found', result: null };
    }

    const result = await this.invoiceService.issueInvoiceByPayment(payment, this.entityManager);
    return { code: 'SUCCESS', message: 'issue invoice successfully', result };
  }
}
