import { Module } from '@nestjs/common'
import { BackupRunnerService } from './backup-runner/backup-runner.service'
import { ChargerRunnerService } from './charger-runner/charger-runner.service'
import { InvoiceRunnerService } from './invoice-runner/invoice-runner.service'
import { OrderExpireRunnerService } from './order-expire-runner/order-expire-runner.service'
import { PaymentRenewRunnerService } from './payment-renew-runner/payment-renew-runner.service'
import { PorterRunnerService } from './porter-runner/porter-runner.service'
import { PortfolioProjectExpireRunnerService } from './portfolio-project-expire-runner/portfolio-project-expire-runner.service'
import { ReminderRunnerService } from './reminder-runner/reminder-runner.service'

@Module({
  providers: [
    BackupRunnerService,
    ChargerRunnerService,
    InvoiceRunnerService,
    OrderExpireRunnerService,
    PaymentRenewRunnerService,
    PorterRunnerService,
    PortfolioProjectExpireRunnerService,
    ReminderRunnerService,
  ],
})
export class RunnerModule {}
