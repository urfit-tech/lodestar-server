import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '~/auth/auth.guard';
import { ProgramService } from './program.service';

@UseGuards(AuthGuard)
@Controller({
  path: 'programs',
  version: '2',
})
export class ProgramController {
  constructor(private programService: ProgramService) {}

  @Get(':memberId')
  async getProgramByMemberId(@Param('memberId') memberId: string) {
    return this.programService.getProgramByMemberId(memberId);
  }
}
