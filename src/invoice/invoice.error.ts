/**
 * Raised before calling ezPay when a manually issued invoice would take the order's unrevoked invoices past the
 * order amount. Nothing is issued and nothing is written.
 */
export class InvoiceExceedsOrderAmountError extends Error {
  static readonly code = 'E_INVOICE_EXCEEDS_ORDER_AMOUNT';

  constructor(message: string) {
    super(message);
    this.name = 'InvoiceExceedsOrderAmountError';
  }
}
