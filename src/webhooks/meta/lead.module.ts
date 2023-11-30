import { Module } from '@nestjs/common';
import { LeadController } from './lead.controller';

@Module({
  controllers: [LeadController],
  imports: [],
  providers: [],
  exports: [],
})
export class LeadModule {}
