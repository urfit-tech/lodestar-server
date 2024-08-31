import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { AuthGuard } from '~/auth/auth.guard';
import { IssueInvoiceBodyDTO, RevokeInvoiceBodyDTO, SearchInvoiceBodyDTO } from './invoice.dto';
import { InvoiceService } from './invoice.service';

@UseGuards(AuthGuard)
@Controller({
  path: 'invoice',
  version: '2',
})
export class InvoiceController {
  constructor(
    private readonly invoiceService: InvoiceService,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}

  @Post('issue')
  async issueInvoice(@Body() dto: IssueInvoiceBodyDTO) {
    const { invoiceGatewayId, invoiceInfo, appId, orderId } = dto;

    const result = await this.invoiceService.issueInvoiceDirectly(
      appId,
      orderId,
      invoiceGatewayId,
      invoiceInfo,
      this.entityManager,
    );
    return { code: 'SUCCESS', message: 'issue invoice successfully', result };
  }

  @Post('search')
  async searchInvoice(@Body() dto: SearchInvoiceBodyDTO) {
    const { invoiceNumber, invoiceGatewayId, appId, invoiceRandomNumber } = dto;

    const result = await this.invoiceService.searchInvoice(
      appId,
      invoiceGatewayId,
      invoiceNumber,
      invoiceRandomNumber,
      this.entityManager,
    );
    return { code: 'SUCCESS', message: 'search invoice successfully', result };
  }

  @Post('revoke')
  async revokeInvoice(@Body() dto: RevokeInvoiceBodyDTO) {
    const { invoiceNumber, invoiceGatewayId, appId, invalidReason } = dto;

    const result = await this.invoiceService.revokeInvoice(
      appId,
      invoiceGatewayId,
      invoiceNumber,
      invalidReason,
      this.entityManager,
    );
    return { code: 'SUCCESS', message: 'revoke invoice successfully', result };
  }
}
