import { EntityManager } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Activity } from '~/entity/Activity';
import { ActivityTicket } from '~/entity/ActivityTicket';
import { AppointmentPlan } from '~/entity/AppointmentPlan';
import { Card } from '~/entity/Card';
import { ProgramRole } from '~/entity/ProgramRole';
import { ProgramPlan } from '~/entity/ProgramPlan';
import { ProjectPlan } from '~/entity/ProjectPlan';
import { ProgramPackagePlan } from '~/entity/ProgramPackagePlan';
import { Program } from '~/entity/Program';
import { PodcastProgram } from '~/podcast/entity/PodcastProgram';
import { PodcastPlan } from '~/entity/PodcastPlan';
import { Merchandise } from '~/entity/Merchandise';
import { MerchandiseSpec } from '~/entity/MerchandiseSpec';
import { Product } from '~/entity/Product';
import { camelCase, isEmpty, mapKeys, uniq } from 'lodash';
import { ProductOwner } from './product.type';

@Injectable()
export class ProductInfrastructure {
  async getProductOwnerByProducts(appId: string, products: Array<Product>, manager: EntityManager) {
    const activityTicketIds: Array<string> = [];
    const appointmentPlanIds: Array<string> = [];
    const cardIds: Array<string> = [];
    const programPlanIds: Array<string> = [];
    const projectPlanIds: Array<string> = [];
    const programPackagePlanIds: Array<string> = [];
    const programIds: Array<string> = [];
    const podcastProgramIds: Array<string> = [];
    const podcastPlanIds: Array<string> = [];
    const merchandiseIds: Array<string> = [];
    const merchandiseSpecIds: Array<string> = [];

    for (const product of products) {
      switch (product.type) {
        case 'ActivityTicket':
          activityTicketIds.push(product.target);
          break;
        case 'AppointmentPlan':
          appointmentPlanIds.push(product.target);
          break;
        case 'Card':
          cardIds.push(product.target);
          break;
        case 'ProgramPlan':
          programPlanIds.push(product.target);
          break;
        case 'ProjectPlan':
          projectPlanIds.push(product.target);
          break;
        case 'ProgramPackagePlan':
          programPackagePlanIds.push(product.target);
          break;
        case 'Program':
          programIds.push(product.target);
          break;
        case 'PodcastProgram':
          podcastProgramIds.push(product.target);
          break;
        case 'PodcastPlan':
          podcastPlanIds.push(product.target);
          break;
        case 'Merchandise':
          merchandiseIds.push(product.target);
          break;
        case 'MerchandiseSpec':
          merchandiseSpecIds.push(product.target);
          break;
      }
    }

    const sql: Array<string> = [];

    if (!isEmpty(activityTicketIds)) {
      sql.push(this.getActivityTicketProductOwner(appId, uniq(activityTicketIds), manager).getSql());
    }
    if (!isEmpty(appointmentPlanIds)) {
      sql.push(this.getAppointmentPlanProductOwner(appId, uniq(appointmentPlanIds), manager).getSql());
    }
    if (!isEmpty(cardIds)) {
      sql.push(this.getCardProductOwner(appId, uniq(cardIds), manager).getSql());
    }
    if (!isEmpty(programPlanIds)) {
      sql.push(this.getProgramPlanProductOwner(appId, uniq(programPlanIds), manager).getSql());
    }
    if (!isEmpty(programPackagePlanIds)) {
      sql.push(this.getProgramPackagePlanProductOwner(appId, uniq(programPackagePlanIds), manager).getSql());
    }
    if (!isEmpty(projectPlanIds)) {
      sql.push(this.getProjectPlanProductOwner(appId, uniq(projectPlanIds), manager).getSql());
    }
    if (!isEmpty(programIds)) {
      sql.push(this.getProgramProductOwner(appId, uniq(programIds), manager).getSql());
    }
    if (!isEmpty(podcastProgramIds)) {
      sql.push(this.getPodcastProgramProductOwner(appId, uniq(podcastProgramIds), manager).getSql());
    }
    if (!isEmpty(podcastPlanIds)) {
      sql.push(this.getPodcastPlanProductOwner(appId, uniq(podcastPlanIds), manager).getSql());
    }
    if (!isEmpty(merchandiseIds)) {
      sql.push(this.getMerchandiseProductOwner(appId, uniq(merchandiseIds), manager).getSql());
    }
    if (!isEmpty(merchandiseSpecIds)) {
      sql.push(this.getMerchandiseSpecProductOwner(appId, uniq(merchandiseSpecIds), manager).getSql());
    }

    const productOwners = await manager.query(sql.join(' UNION '));
    return productOwners.map((owner) => mapKeys(owner, (_, k) => camelCase(k)));
  }

  targetsToSql(targets: string[]) {
    return targets.map((v) => JSON.stringify(v).replace(/"/g, "'")).join(', ');
  }

  getActivityTicketProductOwner(appId: string, targets: string[], manager: EntityManager) {
    const activityWithOrganizer = manager
      .getRepository(Activity)
      .createQueryBuilder('activity')
      .select('activity.id as aid')
      .addSelect('organizer.name as organizer_name')
      .leftJoin('activity.organizer', 'organizer')
      .where(`activity.app_id = '${appId}'`);

    const productOwner = manager
      .createQueryBuilder(ActivityTicket, 'activityTicket')
      .select('activityTicket.id as product_id')
      .addSelect('organizer_name as member_name')
      .innerJoin(
        `(${activityWithOrganizer.getSql()})`,
        'activityWithOrganizer',
        '"activityWithOrganizer"."aid" = "activityTicket"."activity_id"',
      )
      .where(`("activityTicket"."id" IN (${this.targetsToSql(targets)}))`);

    return productOwner;
  }

  getAppointmentPlanProductOwner(appId: string, targets: string[], manager: EntityManager) {
    const productOwner = manager
      .getRepository(AppointmentPlan)
      .createQueryBuilder('appointmentPlan')
      .select('appointmentPlan.id as product_id')
      .addSelect('creator.name as member_name')
      .leftJoin('appointmentPlan.creator', 'creator')
      .where(`(appointmentPlan.id IN (${this.targetsToSql(targets)}))`)
      .andWhere(`(creator.app_id) = '${appId}'`);

    return productOwner;
  }

  getCardProductOwner(appId: string, targets: string[], manager: EntityManager) {
    const productOwner = manager
      .getRepository(Card)
      .createQueryBuilder('card')
      .select('card.id as product_id')
      .addSelect('card.creator_id as member_name') // card creator is always null
      .where(`(card.id IN (${this.targetsToSql(targets)}))`)
      .andWhere(`(card.app_id) = '${appId}'`);
    return productOwner;
  }

  getProgramPlanProductOwner(appId: string, targets: string[], manager: EntityManager) {
    const programPlan = manager
      .createQueryBuilder(ProgramPlan, 'programPlan')
      .select('programPlan.id as pid')
      .addSelect('programPlan.program_id as program_id')
      .leftJoin('programPlan.program', 'program')
      .where(`(programPlan.id IN (${this.targetsToSql(targets)}))`)
      .andWhere(`program.app_id = '${appId}'`);

    const productOwner = manager
      .createQueryBuilder(ProgramRole, 'programRole')
      .select('"programPlan"."pid" as product_id')
      .addSelect('"member"."name" as member_name')
      .leftJoin('programRole.member', 'member')
      .where(`"programRole"."name" = 'instructor'`)
      .innerJoin(`(${programPlan.getSql()})`, 'programPlan', '"programPlan"."program_id" = "programRole"."program_id"');

    return productOwner;
  }

  getProjectPlanProductOwner(appId: string, targets: string[], manager: EntityManager) {
    const productOwner = manager
      .createQueryBuilder(ProjectPlan, 'projectPlan')
      .select('projectPlan.id as product_id')
      .addSelect('member.name as member_name')
      .leftJoin('projectPlan.project', 'project')
      .leftJoin('member', 'member', 'member.id = project.creator_id')
      .where(`(projectPlan.id IN (${this.targetsToSql(targets)}))`)
      .andWhere(`project.app_id = '${appId}'`);

    return productOwner;
  }

  getProgramPackagePlanProductOwner(appId: string, targets: string[], manager: EntityManager) {
    const productOwner = manager
      .createQueryBuilder(ProgramPackagePlan, 'programPackagePlan')
      .select('programPackagePlan.id as product_id')
      .addSelect('member.name as member_name')
      .leftJoin('programPackagePlan.programPackage', 'programPackage')
      .leftJoin('member', 'member', 'member.id = programPackage.creator_id')
      .where(`(programPackagePlan.id IN (${this.targetsToSql(targets)}))`)
      .andWhere(`programPackage.app_id = '${appId}'`);

    return productOwner;
  }

  getProgramProductOwner(appId: string, targets: string[], manager: EntityManager) {
    const program = manager
      .createQueryBuilder(Program, 'program')
      .select('program.id as program_id')
      .where(`(program.id IN (${this.targetsToSql(targets)}))`)
      .andWhere(`program.app_id = '${appId}'`);

    const productOwner = manager
      .createQueryBuilder(ProgramRole, 'programRole')
      .select('"program"."program_id" as product_id')
      .addSelect('"member"."name" as member_name')
      .leftJoin('programRole.member', 'member')
      .where(`programRole.name = 'instructor'`)
      .innerJoin(`(${program.getSql()})`, 'program', 'program.program_id = programRole.program_id');

    return productOwner;
  }

  getPodcastProgramProductOwner(appId: string, targets: string[], manager: EntityManager) {
    const productOwner = manager
      .createQueryBuilder(PodcastProgram, 'podcastProgram')
      .select('podcastProgram.id as product_id')
      .addSelect('creator.name as member_name')
      .leftJoin('podcastProgram.creator', 'creator')
      .where(`(podcastProgram.id IN (${this.targetsToSql(targets)}))`)
      .andWhere(`creator.app_id = '${appId}'`);

    return productOwner;
  }

  getPodcastPlanProductOwner(appId: string, targets: string[], manager: EntityManager) {
    const productOwner = manager
      .createQueryBuilder(PodcastPlan, 'podcastPlan')
      .select('podcastPlan.id as product_id')
      .addSelect('creator.name as member_name')
      .leftJoin('podcastPlan.creator', 'creator')
      .where(`(podcastPlan.id IN (${this.targetsToSql(targets)}))`)
      .andWhere(`creator.app_id = '${appId}'`);

    return productOwner;
  }

  getMerchandiseProductOwner(appId: string, targets: string[], manager: EntityManager) {
    const productOwner = manager
      .createQueryBuilder(Merchandise, 'merchandise')
      .select('merchandise.id as product_id')
      .addSelect('member.name as member_name')
      .leftJoin('merchandise.member', 'member')
      .where(`(merchandise.id IN (${this.targetsToSql(targets)}))`)
      .andWhere(`merchandise.app_id = '${appId}'`);

    return productOwner;
  }

  getMerchandiseSpecProductOwner(appId: string, targets: string[], manager: EntityManager) {
    const merchandise = manager
      .createQueryBuilder(Merchandise, 'merchandise')
      .select('merchandise.id as mid')
      .addSelect('member.name as member_name')
      .leftJoin('merchandise.member', 'member')
      .where(`merchandise.app_id = '${appId}'`);

    const productOwner = manager
      .createQueryBuilder(MerchandiseSpec, 'merchandiseSpec')
      .select('merchandiseSpec.id as product_id')
      .addSelect('merchandise.member_name as member_name')
      .innerJoin(`(${merchandise.getSql()})`, 'merchandise', 'merchandise.mid = merchandiseSpec.merchandise_id')
      .where(`(merchandiseSpec.id IN (${this.targetsToSql(targets)}))`);

    return productOwner;
  }
}
