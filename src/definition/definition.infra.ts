import { EntityManager, In } from 'typeorm';
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

  async upsertProperties(
    appId: string,
    propertyNames: Array<string>,
    entityManager: EntityManager,
  ): Promise<Array<Property>> {
    const propertyRepo = entityManager.getRepository(Property);
    const existingProperties = await propertyRepo.find({
      where: { appId, name: In(propertyNames) },
    });
    const existingPropertyNames = existingProperties.map((property) => property.name);
    const newPropertyNames = propertyNames.filter((propertyName) => !existingPropertyNames.includes(propertyName));
    if (newPropertyNames.length === 0) {
      return existingProperties;
    }
    const count = await propertyRepo.count({ where: { appId } });
    const newProperties = newPropertyNames.map((propertyName, index) => {
      const property = new Property();
      property.name = propertyName;
      property.type = 'member';
      property.position = count + index + 1;
      property.appId = appId;
      return property;
    });
    const savedProperties = await propertyRepo.save(newProperties);
    return [...existingProperties, ...savedProperties];
  }
}
