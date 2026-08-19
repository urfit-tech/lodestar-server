import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { APIException } from '~/api.excetion';
import { AuthGuard } from '~/auth/auth.guard';
import { JwtMember } from '~/auth/auth.dto';
import { Local } from '~/decorator';
import { PermissionSet } from '~/enums/PermissionSet.enum';
import { IssueInvoiceBodyDTO, RevokeInvoiceBodyDTO, SearchInvoiceBodyDTO } from './invoice.dto';
import { InvoiceService } from './invoice.service';

// Manual invoicing lives on the sale collection card, which the admin UI reaches
// two ways: the sales menu (any of the five sales permissions below) and the
// member page's order tab (SALES_RECORDS_ADMIN or CHECK_MEMBER_ORDER). These
// endpoints mirror that union so the API allows exactly what the UI offers.
const INVOICE_ADMIN_PERMISSIONS: Array<string> = [
  PermissionSet.SALES_RECORDS_ADMIN,
  PermissionSet.SALES_RECORDS_NORMAL,
  PermissionSet.SALES_RECORDS_DETAILS,
  PermissionSet.GROSS_SALES_ADMIN,
  PermissionSet.GROSS_SALES_NORMAL,
  PermissionSet.CHECK_MEMBER_ORDER,
];

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
    this.assertInvoiceAdmin(member);
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
    this.assertInvoiceAdmin(member);
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
    this.assertInvoiceAdmin(member);
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

  private assertInvoiceAdmin(member: JwtMember): void {
    const isAppOwner = member?.role === 'app-owner';
    const hasInvoicePermission = (member?.permissions || []).some(permission =>
      INVOICE_ADMIN_PERMISSIONS.includes(permission),
    );

    if (!isAppOwner && !hasInvoicePermission) {
      throw new APIException({ code: 'E_NO_PERMISSION', message: 'no permission to operate invoices' }, 403);
    }
  }

  private getAppId(member: JwtMember): string {
    if (!member?.appId) {
      throw new APIException({ code: 'E_NO_APP_ID', message: 'appId is missing from the authenticated token' }, 403);
    }
    return member.appId;
  }
}
