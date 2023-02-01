import { Module } from '@nestjs/common'
import { ActivityModule } from '~/module/activity/activity.module'
import { AppointmentModule } from '~/module/appointment/appointment.module'
import { PodcastModule } from '~/module/podcast/podcast.module'
import { ProgramModule } from '~/module/program/program.module'
import { ProductService } from '~/module/product/product.service'
import { ProjectModule } from '~/module/project/project.module'
import { CardService } from './card/card.service'
import { MerchandiseSpecService } from './merchandise-spec/merchandise-spec.service'
import { TokenService } from './token/token.service'

@Module({
  imports: [ProgramModule, ProjectModule, ActivityModule, AppointmentModule, PodcastModule],
  providers: [ProductService, CardService, MerchandiseSpecService, TokenService],
})
export class ProductModule {}
