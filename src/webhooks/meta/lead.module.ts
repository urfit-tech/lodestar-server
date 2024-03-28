import { Module } from '@nestjs/common';
import { LeadController } from './lead.controller';
import { AppModule } from '~/app/app.module';
import { DefinitionModule } from '~/definition/definition.module';
import { MemberModule } from '~/member/member.module';
import { LeadService } from './lead.service';

@Module({
  controllers: [LeadController],
  imports: [AppModule, DefinitionModule, MemberModule],
  providers: [LeadService],
  exports: [],
})
export class LeadModule {}
