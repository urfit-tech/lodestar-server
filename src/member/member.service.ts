import { Injectable } from "@nestjs/common";
import { EntityManager, In } from "typeorm";

import { MemberProperty } from "~/entity/MemberProperty";

@Injectable()
export class MemberService {
  async getMemberPropertiesByIds(memberId: string, propertyIds: Array<string>, manager: EntityManager) {
    const memberPropertyRepo = manager.getRepository(MemberProperty);
    const founds = await memberPropertyRepo.find({
      where: { id: In(propertyIds), memberId },
    });
    return founds;
  }
}