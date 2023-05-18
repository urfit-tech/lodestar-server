import { v4 } from 'uuid';

import { App } from '~/entity/App';
import { AppPlan } from '~/entity/AppPlan';
import { Role } from '~/entity/Role';

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
