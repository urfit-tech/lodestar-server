import { v4 } from 'uuid';

import { Role } from '~/entity/Role';
import { AppPlan } from '~/entity/AppPlan';
import { Category } from '~/definition/entity/category.entity';
import { Property } from '~/definition/entity/property.entity';
import { Tag } from '~/definition/entity/tag.entity';
import { App } from '~/app/entity/app.entity';
import { AppHost } from '~/app/entity/app_host.entity';
import { AppSetting } from '~/app/entity/app_setting.entity';
import { AppSecret } from '~/app/entity/app_secret.entity';
import { Member } from '~/member/entity/member.entity';
import { Program } from '~/entity/Program';
import { ProgramRole } from '~/entity/ProgramRole';
import { ProgramContentBody } from '~/entity/ProgramContentBody';
import { ProgramContent } from '~/program/entity/program_content.entity';
import { ProgramContentProgress } from '~/entity/ProgramContentProgress';
import { ProgramContentSection } from '~/entity/ProgramContentSection';
import { OrderLog } from '~/order/entity/order_log.entity';
import { OrderProduct } from '~/order/entity/order_product.entity';
import { Product } from '~/entity/Product';
import { ProgramPlan } from '~/entity/ProgramPlan';
import { Currency } from '~/entity/Currency';

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

export const appHost = new AppHost();
appHost.appId = app.id;
appHost.host = 'test.something.com';

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

export const program = new Program();
program.id = v4();
program.title = 'test program';
program.abstract = 'test program abstract';
program.appId = app.id;

export const programPlan = new ProgramPlan();
programPlan.id = v4();
programPlan.programId = program.id;
programPlan.title = 'test program plan';
programPlan.listPrice = 0;

export const programRole = new ProgramRole();
programRole.id = v4();
programRole.name = 'owner';
programRole.memberId = member.id;

export const programContentSection = new ProgramContentSection();
programContentSection.id = v4();
programContentSection.programId = program.id;
programContentSection.title = 'test program content section title';
programContentSection.position = 0;

export const programContentBody = new ProgramContentBody();
programContentBody.id = v4();

export const programContent = new ProgramContent();
programContent.id = v4();
programContent.contentSectionId = programContentSection.id;
programContent.contentBodyId = programContentBody.id;
programContent.title = 'test program content title';
programContent.position = 0;
programContent.displayMode = 'payToWatch';

export const programContentProgress = new ProgramContentProgress();
programContentProgress.id = v4();
programContentProgress.programContentId = programContent.id;
programContentProgress.memberId = member.id;
programContentProgress.progress = 1;
programContentProgress.lastProgress = 1;

export const orderLog = new OrderLog();
orderLog.id = 'TES1234567890';
orderLog.memberId = member.id;
orderLog.status = 'SUCCESS';
orderLog.appId = app.id;
orderLog.invoiceOptions = {};

export const product = new Product();
product.type = 'ProgramPlan';
product.id = `${product.type}_${programPlan.id}`;
product.target = programPlan.id;

export const currency = new Currency();
currency.id = 'TWD';
currency.label = '';
currency.unit = '';
currency.name = '';

export const orderProduct = new OrderProduct();
orderProduct.id = v4();
orderProduct.orderId = orderLog.id;
orderProduct.productId = product.id;
orderProduct.name = programPlan.title;
orderProduct.deliveredAt = new Date();
orderProduct.price = programPlan.listPrice;
