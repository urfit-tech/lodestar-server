const rawSql = `
  CREATE OR REPLACE FUNCTION func_table_log() RETURNS trigger AS
  $$
  DECLARE

  table_name text = TG_ARGV[0]::text;
  member_id text = COALESCE(
    current_setting('hasura.user', TRUE),
    'System or FromDB'
  );

  BEGIN
  INSERT INTO
    table_log(member_id, table_name, old, new)
  VALUES
    (
      member_id,
      table_name,
      row_to_json(OLD.*),
      row_to_json(NEW.*)
    );

  RETURN NEW;

  END $$ LANGUAGE plpgsql;
`;
export default rawSql;
