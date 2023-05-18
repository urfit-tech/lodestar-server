import { isArray } from 'lodash';
import { EntityManager } from 'typeorm';
import { Injectable } from '@nestjs/common';

import { Invoice } from './invoice.entity';

@Injectable()
export class InvoiceInfrastructure {
  public save(invoice: Invoice | Array<Invoice>, manager?: EntityManager): Promise<Array<Invoice>> {
    const invoiceRepo = manager.getRepository(Invoice);
    return invoiceRepo.save(isArray(invoice) ? invoice : [invoice]);
  }
}
