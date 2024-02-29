import { isArray } from 'lodash';
import { EntityManager } from 'typeorm';
import { Injectable } from '@nestjs/common';

import { Invoice } from './invoice.entity';
import { AppInvoiceGateway } from '~/entity/AppInvoiceGateway';

@Injectable()
export class InvoiceInfrastructure {
  public save(invoice: Invoice | Array<Invoice>, manager?: EntityManager): Promise<Array<Invoice>> {
    const invoiceRepo = manager.getRepository(Invoice);
    return invoiceRepo.save(isArray(invoice) ? invoice : [invoice]);
  }

  async getAppInvoiceGateway(appId: string, gatewayId: string, manager: EntityManager): Promise<AppInvoiceGateway> {
    const appInvoiceGatewayRepo = manager.getRepository(AppInvoiceGateway);
    return await appInvoiceGatewayRepo.findOneBy({ appId, gatewayId });
  }
}
