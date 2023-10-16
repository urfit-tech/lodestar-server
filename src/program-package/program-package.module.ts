import { Module } from '@nestjs/common';

import { ProgramPackageService } from './program-package.service';
import { ProgramPackagePlanService } from './program-package-plan/program-package-plan.service';
import { ProgramPackageController } from './program-package.controller';
import { AuthModule } from '~/auth/auth.module';

@Module({
  controllers: [ProgramPackageController],
  imports: [AuthModule],
  providers: [ProgramPackageService, ProgramPackagePlanService],
  exports: [],
})
export class ProgramModule {}
