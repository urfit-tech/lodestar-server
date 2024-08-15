import { Injectable } from '@nestjs/common';
import { CreateTemporallyExclusiveResourceRruleDto } from './dto/temporally-exclusive-resource-rrule.dto';

@Injectable()
export class TemporallyExclusiveResourceRruleService {
  create(createTemporallyExclusiveResourceRruleDto: CreateTemporallyExclusiveResourceRruleDto) {
    return 'This action adds a new TemporallyExclusiveResourceRrule';
  }

  findAll() {
    return `This action returns all TemporallyExclusiveResourceRrule`;
  }

  findOne(id: number) {
    return `This action returns a #${id} TemporallyExclusiveResourceRrule`;
  }

  // update(id: number, updateTemporallyExclusiveResourceRruleDto: UpdateTemporallyExclusiveResourceRruleDto) {
  //   return `This action updates a #${id} TemporallyExclusiveResourceRrule`;
  // }

  remove(id: number) {
    return `This action removes a #${id} TemporallyExclusiveResourceRrule`;
  }
}
