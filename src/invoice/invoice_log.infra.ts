import { isArray } from 'lodash';
import { EntityManager } from 'typeorm';
import { Injectable } from '@nestjs/common';

import { InvoiceLog } from './invoice_log.entity';

@Injectable()
export class InvoiceLogInfrastructure {
  public save(invoiceLog: InvoiceLog | Array<InvoiceLog>, manager?: EntityManager): Promise<Array<InvoiceLog>> {
    const invoiceLogRepo = manager.getRepository(InvoiceLog);
    return invoiceLogRepo.save(isArray(invoiceLog) ? invoiceLog : [invoiceLog]);
  }
}
