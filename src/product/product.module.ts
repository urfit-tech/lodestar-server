import { Module } from '@nestjs/common';
import { ActivityModule } from '~/activity/activity.module';
import { AppointmentModule } from '~/appointment/appointment.module';
import { PodcastModule } from '~/podcast/podcast.module';
import { ProductService } from '~/product/product.service';
import { ProgramModule } from '~/program/program.module';
import { ProjectModule } from '~/project/project.module';
import { CardService } from '../card/card.service';
import { ProductInfrastructure } from './product.infra';
import { TokenService } from './token/token.service';

@Module({
  imports: [ProgramModule, ProjectModule, ActivityModule, AppointmentModule, PodcastModule],
  providers: [ProductService, CardService, TokenService, ProductInfrastructure],
  exports: [ProductInfrastructure],
})
export class ProductModule {}
