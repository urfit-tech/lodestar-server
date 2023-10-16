import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '~/auth/auth.guard';
import { ProgramPackageService } from './program-package.service';

@UseGuards(AuthGuard)
@Controller({
  path: 'program-packages',
  version: '2',
})
export class ProgramPackageController {
  constructor(private programPackageService: ProgramPackageService) {}

  @Get(':memberId')
  async getProgramPackageByMemberId(@Param('memberId') memberId: string) {
    return this.programPackageService.getProgramPackageByMemberId(memberId);
  }

  @Get(':memberId/expired')
  async getExpiredProgramPackageByMemberId(@Param('memberId') memberId: string) {
    return this.programPackageService.getExpiredProgramPackageByMemberId(memberId);
  }
}
