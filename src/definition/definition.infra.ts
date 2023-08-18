import { EntityManager } from 'typeorm';
import { Injectable } from '@nestjs/common';

import { Category } from './entity/category.entity';
import { Property } from './entity/property.entity';
import { Tag } from './entity/tag.entity';

@Injectable()
export class DefinitionInfrastructure {
  async getCategories(appId: string, entityManager: EntityManager): Promise<Array<Category>> {
    const categoryRepo = entityManager.getRepository(Category);
    return categoryRepo.find({
      where: { appId },
    });
  }

  async getProperties(appId: string, entityManager: EntityManager): Promise<Array<Property>> {
    const propertyRepo = entityManager.getRepository(Property);
    return propertyRepo.find({
      where: { app: { id: appId } },
    });
  }

  async getTags(entityManager: EntityManager): Promise<Array<Tag>> {
    const tagRepo = entityManager.getRepository(Tag);
    return tagRepo.find();
  }
}
