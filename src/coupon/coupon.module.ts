import { Module } from '@nestjs/common';
import { CouponInfrastructure } from './coupon.infra';

@Module({ exports: [CouponInfrastructure], providers: [CouponInfrastructure] })
export class CouponModule {}
