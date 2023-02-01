import { Module } from '@nestjs/common'
import { ActivityModule } from '~/modules/activity/activity.module'
import { AppointmentModule } from '~/modules/appointment/appointment.module'
import { PodcastModule } from '~/modules/podcast/podcast.module'
import { ProgramModule } from '~/modules/program/program.module'
import { ProductService } from '~/modules/product/product.service'
import { ProjectModule } from '~/modules/project/project.module'
import { CardService } from './card/card.service'
import { MerchandiseSpecService } from './merchandise-spec/merchandise-spec.service'
import { TokenService } from './token/token.service'

@Module({
  imports: [ProgramModule, ProjectModule, ActivityModule, AppointmentModule, PodcastModule],
  providers: [ProductService, CardService, MerchandiseSpecService, TokenService],
})
export class ProductModule {}
