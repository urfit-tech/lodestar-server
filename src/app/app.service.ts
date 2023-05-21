import { EntityManager } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';

@Injectable()
export class AppService {
  constructor(
    @InjectEntityManager('phdb') private readonly entityManager: EntityManager,
  ) {}
}