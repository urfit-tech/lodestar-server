import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { APIException } from '~/api.excetion';
import { AuthGuard } from '~/auth/auth.guard';
import { JwtMember } from '~/auth/auth.dto';
import { Local } from '~/decorator';
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
  async issueInvoice(@Local('member') member: JwtMember, @Body() dto: IssueInvoiceBodyDTO) {
    const appId = this.getAppId(member);
    const { invoiceGatewayId, invoiceInfo, orderId } = dto;

    const result = await this.invoiceService.issueInvoiceDirectly(
      appId,
      orderId,
      invoiceGatewayId,
      invoiceInfo,
      this.entityManager,
      { executorMemberId: member?.memberId },
    );
    return { code: 'SUCCESS', message: 'issue invoice successfully', result };
  }

  @Post('search')
  async searchInvoice(@Local('member') member: JwtMember, @Body() dto: SearchInvoiceBodyDTO) {
    const appId = this.getAppId(member);
    const { invoiceNumber, invoiceGatewayId, invoiceRandomNumber } = dto;

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
  async revokeInvoice(@Local('member') member: JwtMember, @Body() dto: RevokeInvoiceBodyDTO) {
    const appId = this.getAppId(member);
    const { invoiceNumber, invoiceGatewayId, invalidReason } = dto;

    const result = await this.invoiceService.revokeInvoice(
      appId,
      invoiceGatewayId,
      invoiceNumber,
      invalidReason,
      this.entityManager,
      member?.memberId,
    );
    return { code: 'SUCCESS', message: 'revoke invoice successfully', result };
  }

  private getAppId(member: JwtMember): string {
    if (!member?.appId) {
      throw new APIException({ code: 'E_NO_APP_ID', message: 'appId is missing from the authenticated token' }, 403);
    }
    return member.appId;
  }
}
