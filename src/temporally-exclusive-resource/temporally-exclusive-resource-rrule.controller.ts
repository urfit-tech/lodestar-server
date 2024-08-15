import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TemporallyExclusiveResourceRruleService } from './temporally-exclusive-resource-rrule.service';
import { CreateTemporallyExclusiveResourceRruleDto } from './dto/temporally-exclusive-resource-rrule.dto';

@Controller('temporally-exclusive-resource-rrule')
export class TemporallyExclusiveResourceRruleController {
  constructor(private readonly TemporallyExclusiveResourceRruleService: TemporallyExclusiveResourceRruleService) {}

  @Post()
  create(@Body() createTemporallyExclusiveResourceRruleDto: CreateTemporallyExclusiveResourceRruleDto) {
    return this.TemporallyExclusiveResourceRruleService.create(createTemporallyExclusiveResourceRruleDto);
  }

  @Get()
  findAll() {
    return this.TemporallyExclusiveResourceRruleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.TemporallyExclusiveResourceRruleService.findOne(+id);
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateTemporallyExclusiveResourceRruleDto: UpdateTemporallyExclusiveResourceRruleDto) {
  //   return this.TemporallyExclusiveResourceRruleService.update(+id, updateTemporallyExclusiveResourceRruleDto);
  // }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.TemporallyExclusiveResourceRruleService.remove(+id);
  }
}
