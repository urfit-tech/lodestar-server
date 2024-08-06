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
import { ProgramPlanFactory } from './factories/product/program-plan.factory';
import { ProductFactoryRegistry } from './factories/product-factory.registry';
import { TokenInfrastructure } from './token/token.infra';

@Module({
  imports: [ProgramModule, ProjectModule, ActivityModule, AppointmentModule, PodcastModule],
  providers: [
    ProductService,
    CardService,
    TokenService,
    ProductInfrastructure,
    TokenInfrastructure,
    ProgramPlanFactory,
    ProductFactoryRegistry,
    ProductService,
    {
      provide: 'PRODUCT_FACTORIES',
      useFactory: (registry: ProductFactoryRegistry, programPlanFactory: ProgramPlanFactory) => {
        registry.registerFactory('ProgramPlan', programPlanFactory);
        return registry;
      },
      inject: [ProductFactoryRegistry, ProgramPlanFactory],
    },
    {
      provide: 'DISCOUNT_FACTORIES',
      useFactory: (registry: ProductFactoryRegistry, programPlanFactory: ProgramPlanFactory) => {
        registry.registerFactory('ProgramPlan', programPlanFactory);
        return registry;
      },
      inject: [ProductFactoryRegistry, ProgramPlanFactory],
    },
  ],
  exports: [ProductInfrastructure, ProductService, TokenInfrastructure],
})
export class ProductModule {}
