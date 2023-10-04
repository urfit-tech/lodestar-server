import { ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity({
  expression: `
  CREATE OR REPLACE VIEW "public"."app_module" AS
  SELECT
    app.id AS app_id,
    app_plan_module.module_id,
    gen_random_uuid() AS id
  FROM
    (
      app
      JOIN app_plan_module ON ((app_plan_module.app_plan_id = app.app_plan_id))
    )
  UNION
  SELECT
    app_extended_module.app_id,
    app_extended_module.module_id,
    gen_random_uuid() AS id
  FROM
    app_extended_module;`,
})
export class AppModule {
  @ViewColumn({ name: 'id' })
  id: string;

  @ViewColumn({ name: 'app_id' })
  appId: string;

  @ViewColumn({ name: 'module_id' })
  moduleId: string;
}
