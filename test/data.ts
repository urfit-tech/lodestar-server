import { v4 } from 'uuid';

import { Role } from '~/entity/Role';
import { AppPlan } from '~/entity/AppPlan';
import { App } from '~/entity/App';
import { Category } from '~/definition/entity/category.entity';
import { Property } from '~/definition/entity/property.entity';
import { Tag } from '~/definition/entity/tag.entity';
import { AppSetting } from '~/app/entity/app_setting.entity';
import { AppSecret } from '~/app/entity/app_secret.entity';
import { Member } from '~/member/entity/member.entity';

export const role = new Role();
role.name = 'app-owner';

export const appPlan = new AppPlan();
appPlan.id = v4();
appPlan.name = 'test-plan';
appPlan.description = 'test plan description';

export const app = new App();
app.id = 'test';
app.symbol = 'TST';
app.appPlan = appPlan;

export const appSetting = new AppSetting();
appSetting.appId = app.id;
appSetting.key = 'auth.service.client_id';
appSetting.value = 'test';

export const appSecret = new AppSecret();
appSecret.appId = app.id;
appSecret.key = 'auth.service.key';
appSecret.value = 'testKey';

export const category = new Category();
category.appId = app.id;
category.class = '';
category.position = 0;
category.name = '測試分類';

export const anotherCategory = new Category();
anotherCategory.appId = app.id;
anotherCategory.class = '';
anotherCategory.position = 0;
anotherCategory.name = 'test-another-category';

export const memberProperty = new Property();
memberProperty.app = app;
memberProperty.type = 'member';
memberProperty.name = 'test-property';

export const memberTag = new Tag();
memberTag.type = 'member';
memberTag.name = 'test-member-tag';

export const anotherMemberTag = new Tag();
anotherMemberTag.type = 'member';
anotherCategory.name = 'test-another-member-tag';

export const member = new Member();
member.id = v4();
member.appId = app.id;
member.email = 'test@example.com';
member.username = 'test';
member.role = role.name;
member.name = 'testMember';
