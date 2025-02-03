import { isArray } from 'lodash';
import { EntityManager, In } from 'typeorm';
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

  async getInvoicesByOrderIds(orderIds: string[], manager: EntityManager): Promise<Array<Invoice>> {
    const InvoiceRepo = manager.getRepository(Invoice);
    const Invoices = await InvoiceRepo.find({
      where: { orderId: In(orderIds) },
    });
    return Invoices;
  }
}
