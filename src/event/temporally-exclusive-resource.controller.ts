import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '~/auth/auth.guard';
import { TemporallyExclusiveResourceService } from './temporally-exclusive-resource.service';
import {
  CreateTemporallyExclusiveResourceDto,
  TemporallyExclusiveResourceType
} from './temporally-exclusive-resource.dto';
import { Local } from '~/decorator';
import { JwtMember } from '~/auth/auth.dto';

@UseGuards(AuthGuard)
@Controller('temporally-exclusive-resource')
export class TemporallyExclusiveResourceController {
  constructor(private readonly TemporallyExclusiveResourceService: TemporallyExclusiveResourceService) { }

  @Get('permission-group')
  async findByPermissionGroupIds(
    @Query('ids') permission_group_ids: string,
    @Query('member_properties') member_properties?: string,
    @Query('type') type?: 'member' | 'physical_space'
  ) {
    const [permissionGroupIds, memberProperties] =
      [permission_group_ids, member_properties].map(str => str ? str?.split(',') : undefined)
    return await this.TemporallyExclusiveResourceService.findByPermissionGroupIds(type)({ permissionGroupIds, memberProperties });
  }

  @Get(':type/:target')
  async findByTarget(
    @Local('member') member: JwtMember,
    @Param('type') type: TemporallyExclusiveResourceType,
    @Param('target') target: string
  ) {
    return await this.TemporallyExclusiveResourceService.findByTarget(type)([target]);
  }

  @Post('/batch/get/:type')
  async findByTargets(
    @Local('member') member: JwtMember,
    @Param('type') type: TemporallyExclusiveResourceType,
    @Body() targets: Array<string>
  ) {
    console.log(`targets: ${targets}`)
    return await this.TemporallyExclusiveResourceService.findByTarget(type)(targets);
  }

  @Post('')
  async create(@Body() createTemporallyExclusiveResourceDto: any) {
    // ought to be amended when testing via lodestar-app-admin
    createTemporallyExclusiveResourceDto.appId = 'tli1956'
    return await this.TemporallyExclusiveResourceService.create(createTemporallyExclusiveResourceDto);
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateTemporallyExclusiveResourceDto: UpdateTemporallyExclusiveResourceDto) {
  //   return this.TemporallyExclusiveResourceService.update(+id, updateTemporallyExclusiveResourceDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.TemporallyExclusiveResourceService.remove(+id);
  // }
}
