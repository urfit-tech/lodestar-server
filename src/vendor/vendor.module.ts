import { Module } from '@nestjs/common';
import { ChenliService } from './chenli/chenli.service';
import { CwgService } from './cwg/cwg.service';
import { ParentingService } from './parenting/parenting.service';
import { VitalCrmService } from './vital-crm/vital-crm.service';

@Module({
  providers: [CwgService, ParentingService, VitalCrmService, ChenliService],
})
export class VendorModule {}
