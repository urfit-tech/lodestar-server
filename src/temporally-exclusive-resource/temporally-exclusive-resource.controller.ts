import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { TemporallyExclusiveResourceService } from './temporally-exclusive-resource.service';
import {
  CreateTemporallyExclusiveResourceDto,
  TemporallyExclusiveResourceType
} from './dto/temporally-exclusive-resource.dto';

@Controller('temporally-exclusive-resource')
export class TemporallyExclusiveResourceController {
  constructor(private readonly TemporallyExclusiveResourceService: TemporallyExclusiveResourceService) { }

  @Post()
  create(@Body() createTemporallyExclusiveResourceDto: CreateTemporallyExclusiveResourceDto) {
    return this.TemporallyExclusiveResourceService.create(createTemporallyExclusiveResourceDto);
  }

  @Get('')
  async findByPermissionGroupIds(
    @Query('permission_group_ids') permission_group_ids: string,
    @Query('member_properties') member_properties?: string,
    @Query('type') type?: TemporallyExclusiveResourceType
  ) {
    const [permissionGroupIds, memberProperties] =
      [permission_group_ids, member_properties].map(str => str ? str?.split(',') : undefined)
    return await this.TemporallyExclusiveResourceService.findByPermissionGroupIds(type)({ permissionGroupIds, memberProperties });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.TemporallyExclusiveResourceService.findOne(+id);
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateTemporallyExclusiveResourceDto: UpdateTemporallyExclusiveResourceDto) {
  //   return this.TemporallyExclusiveResourceService.update(+id, updateTemporallyExclusiveResourceDto);
  // }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.TemporallyExclusiveResourceService.remove(+id);
  }
}
