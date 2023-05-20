SET check_function_bodies = false;
CREATE FUNCTION public.delete_cascade(p_schema character varying, p_table character varying, p_keys character varying, p_subquery character varying DEFAULT NULL::character varying, p_foreign_keys character varying[] DEFAULT ARRAY[]::character varying[]) RETURNS integer
    LANGUAGE plpgsql
    AS $$
declare
    rx record;
    rd record;
    v_sql varchar;
    v_subquery varchar;
    v_primary_key varchar;
    v_foreign_key varchar;
    v_rows integer;
    recnum integer;
begin
    recnum := 0;
    select ccu.column_name into v_primary_key
        from
        information_schema.table_constraints  tc
        join information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name and ccu.constraint_schema=tc.constraint_schema
        and tc.constraint_type='PRIMARY KEY'
        and tc.table_name=p_table
        and tc.table_schema=p_schema;
    for rx in (
        select kcu.table_name as foreign_table_name, 
        kcu.column_name as foreign_column_name, 
        kcu.table_schema foreign_table_schema,
        kcu2.column_name as foreign_table_primary_key
        from information_schema.constraint_column_usage ccu
        join information_schema.table_constraints tc on tc.constraint_name=ccu.constraint_name and tc.constraint_catalog=ccu.constraint_catalog and ccu.constraint_schema=ccu.constraint_schema 
        join information_schema.key_column_usage kcu on kcu.constraint_name=ccu.constraint_name and kcu.constraint_catalog=ccu.constraint_catalog and kcu.constraint_schema=ccu.constraint_schema
        join information_schema.table_constraints tc2 on tc2.table_name=kcu.table_name and tc2.table_schema=kcu.table_schema
        join information_schema.key_column_usage kcu2 on kcu2.constraint_name=tc2.constraint_name and kcu2.constraint_catalog=tc2.constraint_catalog and kcu2.constraint_schema=tc2.constraint_schema
        where ccu.table_name=p_table  and ccu.table_schema=p_schema
        and TC.CONSTRAINT_TYPE='FOREIGN KEY'
        and tc2.constraint_type='PRIMARY KEY'
)
    loop
        v_foreign_key := rx.foreign_table_schema||'.'||rx.foreign_table_name||'.'||rx.foreign_column_name;
        v_subquery := 'select "'||rx.foreign_table_primary_key||'" as key from '||rx.foreign_table_schema||'."'||rx.foreign_table_name||'"
             where "'||rx.foreign_column_name||'"in('||coalesce(p_keys, p_subquery)||') for update';
        if p_foreign_keys @> ARRAY[v_foreign_key] then
            --raise notice 'circular recursion detected';
        else
            p_foreign_keys := array_append(p_foreign_keys, v_foreign_key);
            recnum:= recnum + delete_cascade(rx.foreign_table_schema, rx.foreign_table_name, null, v_subquery, p_foreign_keys);
            p_foreign_keys := array_remove(p_foreign_keys, v_foreign_key);
        end if;
    end loop;
    begin
        if (coalesce(p_keys, p_subquery) <> '') then
            v_sql := 'delete from '||p_schema||'."'||p_table||'" where "'||v_primary_key||'"in('||coalesce(p_keys, p_subquery)||')';
            --raise notice '%',v_sql;
            execute v_sql;
            get diagnostics v_rows = row_count;
            recnum := recnum + v_rows;
        end if;
        exception when others then recnum=0;
    end;
    return recnum;
end;
$$;
CREATE PROCEDURE public.delete_member_product(app_id_to_delete text)
    LANGUAGE plpgsql
    AS $$ begin -- subtracting the amount from the sender's account 
SET
  session_replication_role = replica;
DELETE FROM
  member_property
WHERE
  property_id IN (
    SELECT
      id
    FROM
      property
    where
      app_id = app_id_to_delete
  );
delete from
  property
where
  app_id = app_id_to_delete;
DELETE FROM
  creator_category
WHERE
  category_id IN (
    SELECT
      id
    FROM
      category
    where
      app_id = app_id_to_delete
  );
DELETE FROM
  activity_category
WHERE
  category_id IN (
    SELECT
      id
    FROM
      category
    where
      app_id = app_id_to_delete
  );
DELETE FROM
  member_task
WHERE
  category_id IN (
    SELECT
      id
    FROM
      category
    where
      app_id = app_id_to_delete
  );
DELETE FROM
  merchandise_category
WHERE
  category_id IN (
    SELECT
      id
    FROM
      category
    where
      app_id = app_id_to_delete
  );
DELETE FROM
  podcast_program_category
WHERE
  category_id IN (
    SELECT
      id
    FROM
      category
    where
      app_id = app_id_to_delete
  );
DELETE FROM
  post_category
WHERE
  category_id IN (
    SELECT
      id
    FROM
      category
    where
      app_id = app_id_to_delete
  );
DELETE FROM
  program_category
WHERE
  category_id IN (
    SELECT
      id
    FROM
      category
    where
      app_id = app_id_to_delete
  );
DELETE FROM
  project_category
WHERE
  category_id IN (
    SELECT
      id
    FROM
      category
    where
      app_id = app_id_to_delete
  );
DELETE FROM
  program_package_category
WHERE
  category_id IN (
    SELECT
      id
    FROM
      category
    where
      app_id = app_id_to_delete
  );
DELETE FROM
  member_category
WHERE
  category_id IN (
    SELECT
      id
    FROM
      category
    where
      app_id = app_id_to_delete
  );
DELETE FROM
  podcast_album_category
WHERE
  category_id IN (
    SELECT
      id
    FROM
      category
    where
      app_id = app_id_to_delete
  );
delete from
  category
where
  app_id = app_id_to_delete;
DELETE FROM
  package_item
WHERE
  program_id IN (
    SELECT
      id
    FROM
      program
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  program_announcement
WHERE
  program_id IN (
    SELECT
      id
    FROM
      program
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  program_category
WHERE
  program_id IN (
    SELECT
      id
    FROM
      program
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  program_package_program
WHERE
  program_id IN (
    SELECT
      id
    FROM
      program
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  program_plan
WHERE
  program_id IN (
    SELECT
      id
    FROM
      program
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  program_related_item
WHERE
  program_id IN (
    SELECT
      id
    FROM
      program
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  program_role
WHERE
  program_id IN (
    SELECT
      id
    FROM
      program
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  program_tag
WHERE
  program_id IN (
    SELECT
      id
    FROM
      program
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  program_approval
WHERE
  program_id IN (
    SELECT
      id
    FROM
      program
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  program_content_plan
WHERE
  program_content_id IN (
    select
      id
    FROM
      program_content
    WHERE
      content_section_id IN (
        SELECT
          id
        FROM
          program_content_section
        WHERE
          program_id IN (
            SELECT
              id
            FROM
              program
            WHERE
              app_id = app_id_to_delete
          )
      )
  );
DELETE FROM
  program_content_progress
WHERE
  program_content_id IN (
    select
      id
    FROM
      program_content
    WHERE
      content_section_id IN (
        SELECT
          id
        FROM
          program_content_section
        WHERE
          program_id IN (
            SELECT
              id
            FROM
              program
            WHERE
              app_id = app_id_to_delete
          )
      )
  );
DELETE FROM
  program_content_log
WHERE
  program_content_id IN (
    select
      id
    FROM
      program_content
    WHERE
      content_section_id IN (
        SELECT
          id
        FROM
          program_content_section
        WHERE
          program_id IN (
            SELECT
              id
            FROM
              program
            WHERE
              app_id = app_id_to_delete
          )
      )
  );
DELETE FROM
  program_content_material
WHERE
  program_content_id IN (
    select
      id
    FROM
      program_content
    WHERE
      content_section_id IN (
        SELECT
          id
        FROM
          program_content_section
        WHERE
          program_id IN (
            SELECT
              id
            FROM
              program
            WHERE
              app_id = app_id_to_delete
          )
      )
  );
DELETE FROM
  exercise
WHERE
  program_content_id IN (
    select
      id
    FROM
      program_content
    WHERE
      content_section_id IN (
        SELECT
          id
        FROM
          program_content_section
        WHERE
          program_id IN (
            SELECT
              id
            FROM
              program
            WHERE
              app_id = app_id_to_delete
          )
      )
  );
DELETE FROM
  practice
WHERE
  program_content_id IN (
    select
      id
    FROM
      program_content
    WHERE
      content_section_id IN (
        SELECT
          id
        FROM
          program_content_section
        WHERE
          program_id IN (
            SELECT
              id
            FROM
              program
            WHERE
              app_id = app_id_to_delete
          )
      )
  );
DELETE FROM
  program_content_video
WHERE
  program_content_id IN (
    select
      id
    FROM
      program_content
    WHERE
      content_section_id IN (
        SELECT
          id
        FROM
          program_content_section
        WHERE
          program_id IN (
            SELECT
              id
            FROM
              program
            WHERE
              app_id = app_id_to_delete
          )
      )
  );
DELETE FROM
  program_content
WHERE
  content_section_id IN (
    SELECT
      id
    FROM
      program_content_section
    WHERE
      program_id IN (
        SELECT
          id
        FROM
          program
        WHERE
          app_id = app_id_to_delete
      )
  );
DELETE FROM
  program_content_section
WHERE
  program_id IN (
    SELECT
      id
    FROM
      program
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  program
WHERE
  app_id = app_id_to_delete;
DELETE FROM
  review
WHERE
  member_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  attend
WHERE
  member_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  attend
WHERE
  member_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  activity
WHERE
  organizer_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  appointment_plan
WHERE
  creator_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  comment
WHERE
  member_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  comment_reaction
WHERE
  member_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  comment_reply
WHERE
  member_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  comment_reply_reaction
WHERE
  member_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  coupon
WHERE
  member_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  issue
WHERE
  member_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  issue_reaction
WHERE
  member_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  issue_reply
WHERE
  member_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  issue_reply_reaction
WHERE
  member_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  media
WHERE
  member_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  member_card
WHERE
  member_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  member_shop
WHERE
  member_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  member_tag
WHERE
  member_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  merchandise
WHERE
  member_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  notification
WHERE
  source_member_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  notification
WHERE
  target_member_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  order_log
WHERE
  member_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  member_note
WHERE
  member_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  member_note
WHERE
  author_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  podcast
WHERE
  instructor_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  podcast_plan
WHERE
  creator_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  podcast_program
WHERE
  creator_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  podcast_program_role
WHERE
  member_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  point_log
WHERE
  member_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  program_content_progress
WHERE
  member_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  member_phone
WHERE
  member_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  program_role
WHERE
  member_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  program_tempo_delivery
WHERE
  member_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  voucher
WHERE
  member_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  member_property
WHERE
  member_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  member_contract
WHERE
  author_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  member_task
WHERE
  member_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  member_task
WHERE
  executor_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  member_permission_extra
WHERE
  member_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  program_content_log
WHERE
  member_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  member_social
WHERE
  member_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  playlist
WHERE
  member_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  coin_log
WHERE
  member_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  member_contract
WHERE
  member_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  practice
WHERE
  member_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  exercise
WHERE
  member_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  order_executor
WHERE
  member_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  member_speciality
WHERE
  member_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  member_category
WHERE
  member_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  member
WHERE
  manager_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  creator_display
WHERE
  member_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  app_page
WHERE
  editor_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  podcast_album
WHERE
  author_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  creator_category
WHERE
  creator_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  order_contact
WHERE
  member_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  member_task
WHERE
  author_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  member_permission_group
WHERE
  member_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  member_oauth
WHERE
  member_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  podcast_program_progress
WHERE
  member_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  attachment
WHERE
  author_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  app_page_template
WHERE
  author_id IN (
    SELECT
      id
    FROM
      member
    WHERE
      app_id = app_id_to_delete
  );
DELETE FROM
  member
WHERE
  app_id = app_id_to_delete;
SET
  session_replication_role = DEFAULT;
commit;
end;
$$;
CREATE PROCEDURE public.delete_migration(app_id_to_delete text, migrated_at timestamp without time zone)
    LANGUAGE plpgsql
    AS $$
BEGIN
	SET session_replication_role = REPLICA;
DELETE FROM voucher
WHERE member_id in(
		SELECT
			id FROM member
		WHERE
			app_id = app_id_to_delete
			AND created_at <= migrated_at);
DELETE FROM voucher_code
WHERE voucher_plan_id in(
		SELECT
			id FROM voucher_plan
		WHERE
			created_at <= migrated_at
			AND app_id = app_id_to_delete);
DELETE FROM voucher_plan_product
WHERE voucher_plan_id in(
		SELECT
			id FROM voucher_plan
		WHERE
			created_at <= migrated_at
			AND app_id = app_id_to_delete);
DELETE FROM coupon
WHERE member_id in(
		SELECT
			id FROM member
		WHERE
			app_id = app_id_to_delete
			AND created_at <= migrated_at);
DELETE FROM coupon_plan_product
WHERE coupon_plan_id in(
		SELECT
			coupon_plan.id FROM coupon_plan
		LEFT JOIN coupon_code ON coupon_plan_id = coupon_plan.id
	WHERE
		coupon_code.id IS NULL
		AND coupon_plan.created_at <= migrated_at
	UNION
	SELECT
		coupon_plan_id FROM coupon_code
	WHERE
		app_id = app_id_to_delete
		AND created_at <= migrated_at);
DELETE FROM coupon_plan
WHERE id in(
		SELECT
			coupon_plan.id FROM coupon_plan
		LEFT JOIN coupon_code ON coupon_plan_id = coupon_plan.id
	WHERE
		coupon_code.id IS NULL
		AND coupon_plan.created_at <= migrated_at
	UNION
	SELECT
		coupon_plan_id FROM coupon_code
	WHERE
		app_id = app_id_to_delete
		AND created_at <= migrated_at);
DELETE FROM member_oauth
WHERE member_id in(
		SELECT
			id FROM member
		WHERE
			created_at <= migrated_at
			AND app_id = app_id_to_delete);
DELETE FROM member_phone
WHERE member_id in(
		SELECT
			id FROM member
		WHERE
			created_at <= migrated_at
			AND app_id = app_id_to_delete);
DELETE FROM member_property
WHERE member_id in(
		SELECT
			id FROM member
		WHERE
			created_at <= migrated_at
			AND app_id = app_id_to_delete);
DELETE FROM order_discount
WHERE order_id in(
		SELECT
			id FROM order_log
		WHERE
			member_id in(
				SELECT
					id FROM member
				WHERE
					created_at <= migrated_at
					AND app_id = app_id_to_delete));
DELETE FROM order_product
WHERE order_id in(
		SELECT
			id FROM order_log
		WHERE
			member_id in(
				SELECT
					id FROM member
				WHERE
					created_at <= migrated_at
					AND app_id = app_id_to_delete));
DELETE FROM order_log
WHERE member_id in(
		SELECT
			id FROM member
		WHERE
			created_at <= migrated_at
			AND app_id = app_id_to_delete);
DELETE FROM coupon_code
WHERE created_at <= migrated_at
	AND app_id = app_id_to_delete;
DELETE FROM voucher_plan
WHERE created_at <= migrated_at
	AND app_id = app_id_to_delete;
DELETE FROM property
WHERE created_at <= migrated_at
	AND app_id = app_id_to_delete;
DELETE FROM member
WHERE created_at <= migrated_at
	AND app_id = app_id_to_delete;
SET session_replication_role = DEFAULT;
COMMIT;
END;
$$;
CREATE FUNCTION public.exec(text) RETURNS text
    LANGUAGE plpgsql
    AS $_$ BEGIN EXECUTE $1; RETURN $1; END $_$;
CREATE FUNCTION public.func_table_log() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
END $$;
CREATE FUNCTION public.insert_product() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
    	INSERT INTO product(id, type, target)
    	VALUES(concat(TG_ARGV[0], '_', NEW.id), TG_ARGV[0], NEW.id) on conflict do nothing;   
        RETURN NEW;
    END;
$$;
CREATE FUNCTION public.set_activity_ticket_product() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
        INSERT INTO product VALUES(concat('ActivityTicket_', NEW.id), 'ActivityTicket', NEW.id);
        RETURN NEW;
    END;$$;
CREATE FUNCTION public.set_appointment_plan_product() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO product VALUES (concat('AppointmentPlan_', NEW.id), 'AppointmentPlan', NEW.id);
  RETURN NEW;
END;$$;
CREATE FUNCTION public.set_card_product() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
        INSERT INTO product VALUES(concat('Card_', NEW.id), 'Card', NEW.id);
        RETURN NEW;
    END;
$$;
CREATE FUNCTION public.set_current_timestamp_deleted_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."deleted_at" = NOW();
  RETURN _new;
END;
$$;
CREATE FUNCTION public.set_current_timestamp_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$;
CREATE FUNCTION public.set_estimator_product() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
        INSERT INTO product VALUES(concat('Estimator_', NEW.id), 'Estimator', NEW.id);
        RETURN NEW;
    END;$$;
CREATE FUNCTION public.set_member_manager_updated_audit_log() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
member_id text;
 target text;
options jsonb;
default_options jsonb;
    BEGIN
     member_id = NEW.id;
     target = NEW.manager_id;
    options = json_build_object();
    default_options := json_build_object(
    'operation',TG_OP,
    'schema',TG_TABLE_SCHEMA,
    'table',TG_TABLE_NAME
    );
    IF (TG_OP = 'UPDATE' AND NOT(OLD.manager_id IS NULL AND NEW.manager_id IS NULL) AND (OLD.manager_id IS NULL OR NEW.manager_id IS NULL OR OLD.manager_id<>NEW.manager_id) ) THEN
            INSERT INTO audit_log (member_id,type,target,created_at,options)
            VALUES (member_id, 'MemberManager',target,now(),(default_options||options));
            RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
            INSERT INTO audit_log (member_id,type,target,created_at,options)
            VALUES (member_id, 'MemberManager',target,now(),(default_options||options));
            RETURN NEW;
    END IF;
    RETURN NULL;
    END;
$$;
CREATE FUNCTION public.set_merchandise_product() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
    INSERT INTO product VALUES(concat('Merchandise_', NEW.id), 'Merchandise', NEW.id);
    RETURN NEW;
  END;$$;
CREATE FUNCTION public.set_merchandise_spec_product() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
    INSERT INTO product VALUES(concat('MerchandiseSpec_', NEW.id), 'MerchandiseSpec', NEW.id);
    RETURN NEW;
END;$$;
CREATE FUNCTION public.set_podcast_album_product() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
    INSERT INTO product VALUES(concat('PodcastAlbum_', NEW.id), 'PodcastAlbum', NEW.id);
    RETURN NEW;
  END;$$;
CREATE FUNCTION public.set_podcast_plan_product() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO product VALUES (concat('PodcastPlan_', NEW.id), 'PodcastPlan', NEW.id);
  RETURN NEW;
END;$$;
CREATE FUNCTION public.set_podcast_program_product() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
        INSERT INTO product VALUES(concat('PodcastProgram_', NEW.id), 'PodcastProgram', NEW.id);
        RETURN NEW;
    END;$$;
CREATE FUNCTION public.set_product() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
    	INSERT INTO product VALUES(concat(TG_ARGV[0], '_', NEW.id), TG_ARGV[0], NEW.id) on conflict do nothing;   
        RETURN NEW;
    END;
$$;
CREATE FUNCTION public.set_program_package_plan() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
        INSERT INTO product VALUES(concat('ProgramPackagePlan_', NEW.id), 'ProgramPackagePlan', NEW.id);
        RETURN NEW;
    END;$$;
CREATE FUNCTION public.set_program_package_plan_product() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
        INSERT INTO product VALUES(concat('ProgramPackagePlan_', NEW.id), 'ProgramPackagePlan', NEW.id);
        RETURN NEW;
    END;$$;
CREATE FUNCTION public.set_program_plan_product() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
        INSERT INTO product VALUES(concat('ProgramPlan_', NEW.id), 'ProgramPlan', NEW.id);
        RETURN NEW;
    END;
$$;
CREATE FUNCTION public.set_program_product() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
        INSERT INTO product VALUES(concat('Program_', NEW.id), 'Program', NEW.id);
        RETURN NEW;
    END;
$$;
CREATE FUNCTION public.set_project_plan_product() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
        INSERT INTO product VALUES(concat('ProjectPlan_', NEW.id), 'ProjectPlan', NEW.id);
        RETURN NEW;
    END;$$;
CREATE FUNCTION public.update_modified_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;   
END;
$$;
CREATE TABLE public.activity (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    is_participants_visible boolean DEFAULT false NOT NULL,
    cover_url text,
    organizer_id text NOT NULL,
    app_id text NOT NULL,
    published_at timestamp with time zone,
    "position" integer,
    support_locales jsonb,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_private boolean DEFAULT false NOT NULL
);
CREATE TABLE public.activity_category (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    activity_id uuid NOT NULL,
    category_id text NOT NULL,
    "position" integer NOT NULL
);
CREATE TABLE public.category (
    name text NOT NULL,
    class text NOT NULL,
    "position" integer NOT NULL,
    app_id text NOT NULL,
    id text DEFAULT public.gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    filterable boolean DEFAULT true NOT NULL
);
COMMENT ON COLUMN public.category.class IS 'program | podcastProgram | activity | post | merchandise | creator';
CREATE TABLE public.activity_session (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    started_at timestamp with time zone NOT NULL,
    ended_at timestamp with time zone NOT NULL,
    location text,
    activity_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    threshold numeric,
    online_link text,
    deleted_at timestamp with time zone
);
CREATE TABLE public.activity_session_ticket (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    activity_session_id uuid NOT NULL,
    activity_ticket_id uuid NOT NULL,
    activity_session_type text DEFAULT 'offline'::text NOT NULL
);
COMMENT ON COLUMN public.activity_session_ticket.activity_session_type IS 'offline | online';
CREATE TABLE public.activity_tag (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    activity_id uuid NOT NULL,
    tag_name text NOT NULL,
    "position" integer NOT NULL
);
CREATE TABLE public.activity_ticket (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    started_at timestamp with time zone NOT NULL,
    ended_at timestamp with time zone NOT NULL,
    price numeric NOT NULL,
    count integer NOT NULL,
    description text,
    is_published boolean NOT NULL,
    title text NOT NULL,
    activity_id uuid NOT NULL,
    currency_id text DEFAULT 'TWD'::text NOT NULL,
    deleted_at timestamp with time zone
);
COMMENT ON COLUMN public.activity_ticket.count IS 'unlimited as 99999999';
CREATE TABLE public.product (
    id text DEFAULT public.gen_random_uuid() NOT NULL,
    type text NOT NULL,
    target text NOT NULL,
    sku text,
    coin_back numeric DEFAULT 0 NOT NULL,
    coin_period_amount integer,
    coin_period_type text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
COMMENT ON COLUMN public.product.id IS '{type}_{target}, ex: Program_123-456, ProgramPlan_123-456';
COMMENT ON COLUMN public.product.type IS 'ProgramPlan / ProgramContent / ProgramPackagePlan / ActivityTicket / Card / Merchandise / MerchandiseSpec / ProjectPlan / PodcastProgram / PodcastPlan / AppointmentServicePlan / VoucherPlan';
CREATE TABLE public.app_setting (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    app_id text NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);
COMMENT ON TABLE public.app_setting IS 'app client settings';
CREATE TABLE public.member (
    id text NOT NULL,
    app_id text NOT NULL,
    roles_deprecated jsonb,
    name text DEFAULT '未命名使用者'::text NOT NULL,
    email text NOT NULL,
    picture_url text,
    metadata jsonb DEFAULT jsonb_build_object() NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    logined_at timestamp with time zone,
    username text NOT NULL,
    passhash text,
    facebook_user_id text,
    google_user_id text,
    abstract text,
    title text,
    role text NOT NULL,
    refresh_token uuid DEFAULT public.gen_random_uuid() NOT NULL,
    zoom_user_id_deprecate text,
    youtube_channel_ids jsonb,
    manager_id text,
    assigned_at timestamp with time zone,
    star numeric DEFAULT '0'::numeric,
    line_user_id text,
    commonhealth_user_id text,
    last_member_note_created timestamp with time zone,
    status text DEFAULT 'verified'::text NOT NULL,
    verified_emails jsonb DEFAULT jsonb_build_array() NOT NULL,
    is_business boolean DEFAULT false NOT NULL,
    last_member_note_answered timestamp with time zone,
    last_member_note_called timestamp with time zone,
    CONSTRAINT role CHECK (((role = 'app-owner'::text) OR (role = 'content-creator'::text) OR (role = 'general-member'::text))),
    CONSTRAINT status CHECK ((status = ANY (ARRAY['invited'::text, 'verified'::text, 'activated'::text, 'engaged'::text])))
);
COMMENT ON COLUMN public.member.roles_deprecated IS '["admin", "creator", "member"]';
COMMENT ON COLUMN public.member.role IS 'app-owner / content-creator';
COMMENT ON COLUMN public.member.youtube_channel_ids IS 'array of youtube channel ids';
COMMENT ON COLUMN public.member.status IS 'invited | verified | activated | engaged';
CREATE TABLE public.member_learned_log (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    member_id text NOT NULL,
    period timestamp with time zone NOT NULL,
    duration numeric DEFAULT '0'::numeric,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.order_log (
    id text DEFAULT public.gen_random_uuid() NOT NULL,
    member_id text NOT NULL,
    discount_type integer DEFAULT 0 NOT NULL,
    discount_point numeric DEFAULT 0 NOT NULL,
    discount_coupon_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    invoice_options jsonb NOT NULL,
    discount_price numeric DEFAULT 0 NOT NULL,
    updated_at timestamp with time zone,
    message text,
    payment_model jsonb,
    delivered_at timestamp with time zone,
    deliver_message text,
    shipping jsonb,
    retried_at timestamp with time zone,
    expired_at timestamp with time zone DEFAULT (now() + '3 days'::interval),
    auto_renewed_at timestamp with time zone,
    status text DEFAULT 'UNKNOWN'::text NOT NULL,
    last_paid_at timestamp with time zone,
    is_deleted boolean DEFAULT false NOT NULL,
    parent_order_id text,
    transferred_at timestamp with time zone,
    options jsonb,
    custom_id text,
    invoice_issued_at timestamp with time zone
);
COMMENT ON COLUMN public.order_log.invoice_options IS 'name | email | phone | address | postCode | buyerPhone | uniformTitle | uniformNumber | status | invoiceNumber | invoiceTransNo';
COMMENT ON COLUMN public.order_log.payment_model IS '{type: "perpetual" | "subscription" | "groupBuying", gateway: "spgateway" | "parenting" | "tappay", method: "credit" | "vacc" | "cvs" | "instflag" | "unionpay" | "webatm" | "barcode" }';
COMMENT ON COLUMN public.order_log.delivered_at IS 'merchandise shipping advice';
COMMENT ON COLUMN public.order_log.retried_at IS 'the time failed order retry next time';
COMMENT ON COLUMN public.order_log.expired_at IS 'expired order cannot be paid';
COMMENT ON COLUMN public.order_log.status IS 'SUCCESS, MATCHING, REFUND, PARTIAL_REFUND, PARTIAL_EXPIRED, PARTIAL_PAID, EXPIRED, UNPAID';
CREATE TABLE public.order_product (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    order_id text NOT NULL,
    product_id text NOT NULL,
    name text NOT NULL,
    description text,
    price numeric NOT NULL,
    started_at timestamp with time zone,
    ended_at timestamp with time zone,
    auto_renewed boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    accumulated_errors integer DEFAULT 0,
    deliverables jsonb,
    options jsonb,
    currency_id text DEFAULT 'TWD'::text NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    delivered_at timestamp without time zone
);
CREATE TABLE public.program (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    app_id text NOT NULL,
    title text NOT NULL,
    abstract text,
    description text,
    cover_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    published_at timestamp with time zone,
    is_subscription boolean DEFAULT false NOT NULL,
    sold_at timestamp with time zone,
    list_price numeric,
    sale_price numeric,
    "position" integer,
    in_advance boolean DEFAULT false NOT NULL,
    cover_video_url text,
    is_sold_out boolean,
    support_locales jsonb,
    is_deleted boolean DEFAULT false NOT NULL,
    is_private boolean DEFAULT false NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    is_issues_open boolean DEFAULT true NOT NULL,
    is_countdown_timer_visible boolean DEFAULT false NOT NULL,
    is_introduction_section_visible boolean DEFAULT true NOT NULL,
    meta_tag jsonb,
    is_enrolled_count_visible boolean DEFAULT true NOT NULL,
    cover_mobile_url text,
    cover_thumbnail_url text,
    metadata jsonb,
    views numeric DEFAULT '0'::numeric NOT NULL
);
CREATE TABLE public.program_content (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    content_section_id uuid NOT NULL,
    title text NOT NULL,
    abstract text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    published_at timestamp with time zone,
    "position" integer NOT NULL,
    list_price numeric,
    content_body_id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    sale_price numeric,
    sold_at timestamp with time zone,
    metadata jsonb,
    duration numeric,
    content_type text,
    is_notify_update boolean DEFAULT false NOT NULL,
    notified_at timestamp with time zone,
    display_mode text NOT NULL
);
COMMENT ON COLUMN public.program_content.duration IS 'sec';
COMMENT ON COLUMN public.program_content.display_mode IS 'conceal, trial, loginToTrail, payToWatch';
CREATE TABLE public.program_content_progress (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    member_id text NOT NULL,
    program_content_id uuid NOT NULL,
    progress numeric DEFAULT 0 NOT NULL,
    last_progress numeric DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE public.program_content_section (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    program_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    "position" integer NOT NULL
);
CREATE TABLE public.program_package_plan (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    program_package_id uuid NOT NULL,
    is_subscription boolean NOT NULL,
    title text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    published_at timestamp with time zone,
    period_amount numeric,
    period_type text,
    list_price numeric NOT NULL,
    sale_price numeric,
    sold_at timestamp with time zone,
    discount_down_price numeric,
    "position" numeric NOT NULL,
    is_tempo_delivery boolean DEFAULT false NOT NULL,
    is_participants_visible boolean DEFAULT true NOT NULL
);
COMMENT ON COLUMN public.program_package_plan.period_type IS 'Y / M / W / D';
CREATE VIEW public.program_package_plan_enrollment AS
 SELECT (product.target)::uuid AS program_package_plan_id,
    order_log.member_id,
    order_product.delivered_at AS product_delivered_at
   FROM ((public.order_log
     JOIN public.order_product ON (((order_product.delivered_at < now()) AND (order_product.order_id = order_log.id) AND ((order_product.ended_at IS NULL) OR (order_product.ended_at > now())) AND ((order_product.started_at IS NULL) OR (order_product.started_at <= now())))))
     JOIN public.product ON (((product.id = order_product.product_id) AND (product.type = 'ProgramPackagePlan'::text))));
CREATE TABLE public.program_package_program (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    program_package_id uuid NOT NULL,
    program_id uuid NOT NULL,
    "position" integer DEFAULT 0 NOT NULL
);
CREATE TABLE public.program_plan (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    type integer DEFAULT 1 NOT NULL,
    program_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    gains jsonb,
    sale_price numeric,
    list_price numeric NOT NULL,
    sold_at timestamp with time zone,
    period_type text,
    started_at timestamp with time zone,
    ended_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    discount_down_price numeric DEFAULT 0 NOT NULL,
    currency_id text DEFAULT 'TWD'::text NOT NULL,
    period_amount numeric DEFAULT 1,
    auto_renewed boolean DEFAULT false NOT NULL,
    is_participants_visible boolean DEFAULT true NOT NULL,
    published_at timestamp with time zone,
    is_countdown_timer_visible boolean DEFAULT false NOT NULL,
    group_buying_people numeric,
    remind_period_amount integer,
    remind_period_type text,
    is_primary boolean DEFAULT false NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL
);
COMMENT ON COLUMN public.program_plan.type IS '1 - subscribe all / 2 - subscribe from now / 3 - all';
CREATE VIEW public.program_plan_enrollment AS
 SELECT (product.target)::uuid AS program_plan_id,
    order_log.member_id,
    order_log.updated_at,
    order_product.started_at,
    order_product.ended_at,
    order_product.options,
    order_product.delivered_at AS product_delivered_at
   FROM ((public.order_log
     JOIN public.order_product ON (((order_product.delivered_at < now()) AND (order_product.order_id = order_log.id) AND ((order_product.ended_at IS NULL) OR (order_product.ended_at > now())) AND ((order_product.started_at IS NULL) OR (order_product.started_at <= now())))))
     JOIN public.product ON (((product.id = order_product.product_id) AND (product.type = 'ProgramPlan'::text))));
CREATE TABLE public.program_tag (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    program_id uuid NOT NULL,
    tag_name text NOT NULL,
    "position" integer DEFAULT 0 NOT NULL
);
CREATE TABLE public.coupon (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    member_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    coupon_code_id uuid NOT NULL
);
CREATE TABLE public.coupon_code (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    coupon_plan_id uuid NOT NULL,
    code text NOT NULL,
    count integer NOT NULL,
    app_id text NOT NULL,
    remaining integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT remaining CHECK ((remaining >= 0))
);
CREATE TABLE public.coupon_plan (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    started_at timestamp with time zone,
    ended_at timestamp with time zone,
    type integer DEFAULT 1 NOT NULL,
    "constraint" numeric,
    amount numeric NOT NULL,
    title text NOT NULL,
    description text,
    scope jsonb,
    updated_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    editor_id text
);
COMMENT ON COLUMN public.coupon_plan.type IS '1 - cash / 2 - percent';
CREATE TABLE public.member_oauth (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    member_id text NOT NULL,
    provider text NOT NULL,
    provider_user_id text NOT NULL,
    options jsonb,
    CONSTRAINT provider_constraint CHECK ((provider = ANY (ARRAY['facebook'::text, 'google'::text, 'line'::text, 'line-notify'::text, 'parenting'::text, 'commonhealth'::text, 'cw'::text])))
);
COMMENT ON TABLE public.member_oauth IS 'relationship between member and oauth user';
CREATE TABLE public.order_discount (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    order_id text NOT NULL,
    name text NOT NULL,
    description text,
    price numeric NOT NULL,
    type text NOT NULL,
    target text NOT NULL,
    options jsonb
);
COMMENT ON COLUMN public.order_discount.type IS 'Coupon / Voucher / Card / DownPrice';
CREATE TABLE public.payment_log (
    order_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    no text NOT NULL,
    status text,
    price numeric,
    gateway text,
    options jsonb DEFAULT jsonb_build_object(),
    payment_due_at timestamp with time zone,
    updated_at timestamp with time zone,
    paid_at timestamp with time zone,
    method text,
    custom_no text,
    invoice_issued_at timestamp with time zone,
    invoice_options jsonb DEFAULT jsonb_build_object() NOT NULL
);
COMMENT ON COLUMN public.payment_log.created_at IS 'merchant order number ';
COMMENT ON COLUMN public.payment_log.gateway IS 'spgateway, tappay, ezfund,paypal';
COMMENT ON COLUMN public.payment_log.method IS 'arise from order_log payment_model';
COMMENT ON COLUMN public.payment_log.invoice_options IS 'name | email | phone | address | postCode | buyerPhone | uniformTitle | uniformNumber | status | invoiceNumber | invoiceTransNo';
CREATE TABLE public.post (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    title text NOT NULL,
    cover_url text,
    video_url text,
    published_at timestamp with time zone,
    abstract text,
    description text,
    views integer DEFAULT 0 NOT NULL,
    "position" integer DEFAULT '-1'::integer NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    app_id text NOT NULL,
    code_name text,
    source text,
    meta_tag jsonb,
    pinned_at timestamp with time zone
);
CREATE TABLE public.program_category (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    program_id uuid NOT NULL,
    category_id text NOT NULL,
    "position" integer NOT NULL
);
CREATE TABLE public.program_package (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    title text NOT NULL,
    cover_url text,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    published_at timestamp with time zone,
    app_id text NOT NULL,
    creator_id text,
    meta_tag jsonb,
    is_private boolean DEFAULT false NOT NULL
);
CREATE TABLE public.program_package_category (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    program_package_id uuid NOT NULL,
    category_id text NOT NULL,
    "position" integer NOT NULL
);
CREATE TABLE public.program_package_tag (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    program_package_id uuid NOT NULL,
    tag_name text NOT NULL,
    "position" integer DEFAULT 0 NOT NULL
);
CREATE TABLE public.program_role (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    program_id uuid NOT NULL,
    member_id text NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON COLUMN public.program_role.name IS 'instructor / assistant ';
CREATE TABLE public.project (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    abstract text,
    description text,
    target_amount numeric,
    introduction text,
    updates jsonb,
    comments jsonb,
    contents jsonb,
    cover_type text DEFAULT 'image'::text NOT NULL,
    cover_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    published_at timestamp with time zone,
    expired_at timestamp with time zone,
    template text,
    app_id text NOT NULL,
    is_participants_visible boolean DEFAULT false NOT NULL,
    is_countdown_timer_visible boolean DEFAULT false NOT NULL,
    preview_url text,
    "position" integer DEFAULT '-1'::integer NOT NULL,
    creator_id text,
    target_unit text DEFAULT 'funds'::text NOT NULL,
    introduction_desktop text,
    views numeric DEFAULT '0'::numeric NOT NULL
);
COMMENT ON COLUMN public.project.type IS 'funding / pre-order / on-sale / modular / portfolio';
COMMENT ON COLUMN public.project.cover_type IS 'image / video';
COMMENT ON COLUMN public.project.target_unit IS 'funds / participants';
CREATE TABLE public.project_category (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    category_id text NOT NULL,
    "position" integer NOT NULL
);
CREATE TABLE public.project_plan (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    cover_url text,
    title text NOT NULL,
    description text,
    list_price numeric,
    sale_price numeric,
    sold_at timestamp with time zone,
    discount_down_price numeric DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    is_subscription boolean DEFAULT false NOT NULL,
    period_amount numeric,
    period_type text,
    "position" integer,
    deliverables text,
    is_participants_visible boolean DEFAULT false NOT NULL,
    is_physical boolean DEFAULT false NOT NULL,
    is_limited boolean DEFAULT false NOT NULL,
    published_at timestamp with time zone,
    auto_renewed boolean DEFAULT false NOT NULL,
    options jsonb,
    currency_id text DEFAULT 'TWD'::text NOT NULL
);
COMMENT ON COLUMN public.project_plan.period_type IS 'Y / M / W / D';
CREATE TABLE public.project_plan_product (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    project_plan_id uuid NOT NULL,
    product_id text NOT NULL,
    options jsonb NOT NULL
);
CREATE TABLE public.project_tag (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    tag_name text NOT NULL,
    "position" integer DEFAULT 0 NOT NULL
);
CREATE TABLE public.voucher (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    voucher_code_id uuid NOT NULL,
    member_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);
CREATE TABLE public.voucher_code (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    voucher_plan_id uuid NOT NULL,
    code text NOT NULL,
    count integer NOT NULL,
    remaining integer NOT NULL,
    CONSTRAINT remaining CHECK ((remaining >= 0))
);
CREATE TABLE public.voucher_plan (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    app_id text NOT NULL,
    started_at timestamp with time zone,
    ended_at timestamp with time zone,
    product_quantity_limit integer DEFAULT 1 NOT NULL,
    is_transferable boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    sale_price numeric,
    sale_amount integer,
    editor_id text
);
CREATE TABLE public.app_host (
    host text NOT NULL,
    app_id text NOT NULL,
    priority integer DEFAULT 0 NOT NULL
);
CREATE TABLE public.attachment (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    data jsonb,
    type text,
    target text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    options jsonb,
    app_id text NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    content_type text,
    name text,
    size numeric DEFAULT '-1'::integer NOT NULL,
    author_id text,
    thumbnail_url text,
    filename text,
    duration numeric,
    status text DEFAULT 'READY'::text NOT NULL,
    family text,
    file_id uuid
);
COMMENT ON COLUMN public.attachment.type IS 'OrderProduct / MerchandiseSpec / Material/Practice/ProgramContent';
COMMENT ON COLUMN public.attachment.target IS 'id';
COMMENT ON COLUMN public.attachment.content_type IS 'MIME format';
CREATE TABLE public.achievement_template (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    picture_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.activity_attendance (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    order_product_id uuid NOT NULL,
    activity_session_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.activity_attendance IS '簽到';
CREATE VIEW public.activity_during_period AS
 SELECT activity.id AS activity_id,
    min(activity_session.started_at) AS started_at,
    max(activity_session.ended_at) AS ended_at
   FROM (public.activity
     LEFT JOIN public.activity_session ON ((activity.id = activity_session.activity_id)))
  WHERE (activity.deleted_at IS NULL)
  GROUP BY activity.id;
CREATE VIEW public.activity_ticket_enrollment AS
 SELECT activity_ticket.id AS activity_ticket_id,
    order_log.id AS order_log_id,
    order_log.member_id,
    order_product.id AS order_product_id
   FROM ((public.activity_ticket
     JOIN public.order_product ON ((order_product.product_id = concat('ActivityTicket_', activity_ticket.id))))
     JOIN public.order_log ON (((order_product.delivered_at < now()) AND (order_log.id = order_product.order_id))));
CREATE VIEW public.activity_enrollment AS
 SELECT activity.id AS activity_id,
    activity_session.id AS activity_session_id,
    activity_ticket_enrollment.activity_ticket_id,
    order_log.id AS order_log_id,
    (order_log.invoice_options ->> 'name'::text) AS member_name,
    (order_log.invoice_options ->> 'email'::text) AS member_email,
    (order_log.invoice_options ->> 'phone'::text) AS member_phone,
    order_log.member_id,
    (activity_attendance.id IS NOT NULL) AS attended
   FROM (((((public.activity_ticket_enrollment
     JOIN public.order_log ON ((order_log.id = activity_ticket_enrollment.order_log_id)))
     JOIN public.activity_session_ticket ON ((activity_session_ticket.activity_ticket_id = activity_ticket_enrollment.activity_ticket_id)))
     JOIN public.activity_session ON ((activity_session.id = activity_session_ticket.activity_session_id)))
     JOIN public.activity ON ((activity.id = activity_session.activity_id)))
     LEFT JOIN public.activity_attendance ON (((activity_attendance.order_product_id = activity_ticket_enrollment.order_product_id) AND (activity_attendance.activity_session_id = activity_session.id))));
CREATE VIEW public.activity_session_ticket_enrollment_count AS
 SELECT t.activity_id,
    t.activity_session_id,
    sum(t.activity_offline_session_ticket_count) AS activity_offline_session_ticket_count,
    sum(t.activity_online_session_ticket_count) AS activity_online_session_ticket_count
   FROM ( SELECT activity_ticket.activity_id,
            activity_session_ticket.activity_session_id,
                CASE
                    WHEN (activity_session_ticket.activity_session_type = 'offline'::text) THEN count(activity_ticket.id)
                    ELSE (0)::bigint
                END AS activity_offline_session_ticket_count,
                CASE
                    WHEN (activity_session_ticket.activity_session_type = 'online'::text) THEN count(activity_ticket.id)
                    ELSE (0)::bigint
                END AS activity_online_session_ticket_count
           FROM ((public.order_product
             JOIN public.activity_ticket ON (((order_product.product_id = concat('ActivityTicket_', activity_ticket.id)) AND (order_product.delivered_at < now()))))
             JOIN public.activity_session_ticket ON ((activity_session_ticket.activity_ticket_id = activity_ticket.id)))
          GROUP BY activity_ticket.activity_id, activity_session_ticket.activity_session_id, activity_session_ticket.activity_session_type) t
  GROUP BY t.activity_id, t.activity_session_id;
CREATE VIEW public.activity_ticket_enrollment_count AS
SELECT
    NULL::uuid AS activity_ticket_id,
    NULL::uuid AS activity_id,
    NULL::integer AS count,
    NULL::bigint AS enrollment_count,
    NULL::bigint AS buyable_quantity;
CREATE TABLE public.app (
    id text NOT NULL,
    name text,
    title text,
    description text,
    point_exchange_rate numeric DEFAULT 1,
    point_discount_ratio numeric DEFAULT 0.8,
    point_validity_period numeric DEFAULT 7776000,
    vimeo_project_id text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    symbol text NOT NULL,
    app_plan_id text DEFAULT 'lite'::text NOT NULL,
    started_at timestamp with time zone,
    ended_at timestamp with time zone,
    org_id text,
    CONSTRAINT "symbol rule" CHECK (((length(symbol) >= 2) AND (length(symbol) <= 3) AND (upper(symbol) = symbol)))
);
CREATE TABLE public.app_achievement (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    app_id text NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    countable boolean DEFAULT false NOT NULL,
    is_public boolean DEFAULT false NOT NULL,
    "position" numeric DEFAULT 0 NOT NULL,
    template_id uuid
);
CREATE TABLE public.app_admin (
    host text DEFAULT public.gen_random_uuid() NOT NULL,
    app_id text NOT NULL,
    "position" integer,
    api_host text
);
CREATE TABLE public.app_channel (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    app_id text NOT NULL,
    name text NOT NULL
);
CREATE TABLE public.app_default_permission (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    app_id text NOT NULL,
    permission_id text NOT NULL
);
COMMENT ON TABLE public.app_default_permission IS 'store app''s default permission use for building member_permission view';
CREATE TABLE public.app_email_template (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    app_id text NOT NULL,
    catalog text NOT NULL,
    email_template_id uuid NOT NULL,
    subject text,
    CONSTRAINT catalog CHECK ((catalog = ANY (ARRAY['general-template'::text, 'reset-password'::text, 'deliver-physical-product'::text, 'charge-subscribed-order_product-failed'::text, 'cancel-appointment'::text, 'product-delivered'::text, 'product-expiring'::text, 'activity-ticket-delivered'::text, 'project-portfolio-participant'::text])))
);
CREATE TABLE public.app_extended_module (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    app_id text NOT NULL,
    module_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.app_extended_module IS 'extended module for each app';
CREATE TABLE public.app_language (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    app_id text NOT NULL,
    language text NOT NULL,
    data jsonb DEFAULT jsonb_build_object() NOT NULL
);
CREATE TABLE public.program_content_log (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    member_id text NOT NULL,
    program_content_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    playback_rate numeric NOT NULL,
    started_at numeric NOT NULL,
    ended_at numeric NOT NULL
);
CREATE MATERIALIZED VIEW public.app_learning_status AS
 SELECT member.app_id,
    date(program_content_log.created_at) AS date,
    count(DISTINCT program_content_log.member_id) AS total_count,
    (COALESCE(sum((program_content_log.ended_at - program_content_log.started_at)), (0)::numeric))::integer AS total_duration
   FROM (public.program_content_log
     JOIN public.member ON ((member.id = program_content_log.member_id)))
  WHERE ((program_content_log.ended_at > program_content_log.started_at) AND (program_content_log.created_at >= (now() - '1 year'::interval)))
  GROUP BY member.app_id, (date(program_content_log.created_at))
  WITH NO DATA;
CREATE TABLE public.app_plan_module (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    app_plan_id text NOT NULL,
    module_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.app_plan_module IS 'modules can used for each app plan';
CREATE VIEW public.app_module AS
 SELECT app.id AS app_id,
    app_plan_module.module_id,
    public.gen_random_uuid() AS id
   FROM (public.app
     JOIN public.app_plan_module ON ((app_plan_module.app_plan_id = app.app_plan_id)))
UNION
 SELECT app_extended_module.app_id,
    app_extended_module.module_id,
    public.gen_random_uuid() AS id
   FROM public.app_extended_module;
CREATE TABLE public.app_nav (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    app_id text NOT NULL,
    block text NOT NULL,
    "position" integer NOT NULL,
    label text NOT NULL,
    icon text,
    href text NOT NULL,
    external boolean DEFAULT false NOT NULL,
    locale text DEFAULT 'zh-tw'::text NOT NULL,
    tag text,
    parent_id uuid,
    options jsonb
);
CREATE TABLE public.app_page (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    path text,
    app_id text NOT NULL,
    options jsonb,
    title text,
    craft_data jsonb,
    editor_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    published_at timestamp with time zone,
    is_deleted boolean DEFAULT false NOT NULL,
    meta_tag jsonb
);
CREATE TABLE public.app_page_section (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    type text NOT NULL,
    options jsonb,
    "position" numeric,
    app_page_id uuid NOT NULL
);
CREATE TABLE public.app_page_template (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    root_node_id text NOT NULL,
    data jsonb NOT NULL,
    author_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    published_at timestamp with time zone,
    name text DEFAULT now() NOT NULL,
    cover_url text
);
CREATE TABLE public.app_plan (
    id text NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    video_duration numeric DEFAULT '-1'::numeric NOT NULL,
    watched_seconds numeric DEFAULT '-1'::numeric NOT NULL
);
COMMENT ON TABLE public.app_plan IS 'application plan';
CREATE MATERIALIZED VIEW public.app_program_content_usage AS
 SELECT member.app_id,
    to_char(program_content_log.created_at, 'YYYYMMDDHH'::text) AS date_hour,
    sum((program_content_log.ended_at - program_content_log.started_at)) AS duration
   FROM (public.program_content_log
     JOIN public.member ON ((member.id = program_content_log.member_id)))
  WHERE (program_content_log.ended_at > program_content_log.started_at)
  GROUP BY member.app_id, (to_char(program_content_log.created_at, 'YYYYMMDDHH'::text))
  WITH NO DATA;
CREATE TABLE public.app_secret (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    app_id text NOT NULL,
    key text NOT NULL,
    value text NOT NULL
);
COMMENT ON TABLE public.app_secret IS 'credential secrets for kolable app';
CREATE TABLE public.member_tag (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    member_id text NOT NULL,
    tag_name text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    "position" integer DEFAULT 0 NOT NULL
);
CREATE TABLE public.merchandise (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    title text NOT NULL,
    list_price numeric DEFAULT 0 NOT NULL,
    abstract text,
    description text,
    link text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    published_at timestamp with time zone,
    "position" integer DEFAULT '-1'::integer NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    app_id text NOT NULL,
    meta text,
    member_id text NOT NULL,
    member_shop_id uuid,
    sale_price numeric,
    sold_at timestamp with time zone,
    started_at timestamp with time zone,
    ended_at timestamp with time zone,
    is_physical boolean DEFAULT true NOT NULL,
    is_limited boolean DEFAULT true NOT NULL,
    is_customized boolean DEFAULT false NOT NULL,
    is_countdown_timer_visible boolean DEFAULT false NOT NULL,
    currency_id text DEFAULT 'TWD'::text NOT NULL
);
CREATE TABLE public.merchandise_tag (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    merchandise_id uuid NOT NULL,
    tag_name text NOT NULL,
    "position" integer DEFAULT 0 NOT NULL
);
CREATE TABLE public.podcast_program (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    podcast_id uuid,
    title text NOT NULL,
    sold_at timestamp with time zone,
    published_at timestamp with time zone,
    abstract text,
    cover_url text,
    content_type text,
    creator_id text NOT NULL,
    list_price numeric DEFAULT 0 NOT NULL,
    sale_price numeric,
    updated_at timestamp with time zone,
    duration numeric DEFAULT 0 NOT NULL,
    support_locales jsonb,
    filename text,
    duration_second numeric DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON COLUMN public.podcast_program.podcast_id IS 'we will use this in the future!!!';
CREATE TABLE public.podcast_program_tag (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    podcast_program_id uuid NOT NULL,
    tag_name text NOT NULL,
    "position" integer DEFAULT 0 NOT NULL
);
CREATE TABLE public.post_tag (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    post_id uuid NOT NULL,
    tag_name text NOT NULL,
    "position" integer DEFAULT 0 NOT NULL
);
CREATE TABLE public.search_tag (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    tag_name text NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    app_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE VIEW public.app_tag AS
( SELECT activity_tag.tag_name,
    activity.app_id,
    activity_tag."position"
   FROM (public.activity_tag
     JOIN public.activity ON ((activity_tag.activity_id = activity.id)))
  ORDER BY activity_tag."position")
UNION
( SELECT member_tag.tag_name,
    member.app_id,
    member_tag."position"
   FROM (public.member_tag
     JOIN public.member ON ((member_tag.member_id = member.id)))
  ORDER BY member_tag."position")
UNION
( SELECT merchandise_tag.tag_name,
    merchandise.app_id,
    merchandise_tag."position"
   FROM (public.merchandise_tag
     JOIN public.merchandise ON ((merchandise_tag.merchandise_id = merchandise.id)))
  ORDER BY merchandise_tag."position")
UNION
( SELECT podcast_program_tag.tag_name,
    member.app_id,
    podcast_program_tag."position"
   FROM ((public.podcast_program_tag
     JOIN public.podcast_program ON ((podcast_program_tag.podcast_program_id = podcast_program.id)))
     JOIN public.member ON ((podcast_program.creator_id = member.id)))
  ORDER BY podcast_program_tag."position")
UNION
( SELECT post_tag.tag_name,
    post.app_id,
    post_tag."position"
   FROM (public.post_tag
     JOIN public.post ON ((post_tag.post_id = post.id)))
  ORDER BY post_tag."position")
UNION
( SELECT program_tag.tag_name,
    program.app_id,
    program_tag."position"
   FROM (public.program_tag
     JOIN public.program ON ((program_tag.program_id = program.id)))
  ORDER BY program_tag."position")
UNION
( SELECT search_tag.tag_name,
    search_tag.app_id,
    search_tag."position"
   FROM public.search_tag
  ORDER BY search_tag."position")
UNION
( SELECT project_tag.tag_name,
    project.app_id,
    project_tag."position"
   FROM (public.project_tag
     JOIN public.project ON ((project.id = project_tag.project_id)))
  ORDER BY project_tag."position")
UNION
( SELECT program_package_tag.tag_name,
    program_package.app_id,
    program_package_tag."position"
   FROM (public.program_package_tag
     JOIN public.program_package ON ((program_package.id = program_package_tag.program_package_id)))
  ORDER BY program_package_tag."position");
CREATE TABLE public.app_usage (
    app_id text NOT NULL,
    date_hour text NOT NULL,
    video_duration numeric DEFAULT '-1'::numeric NOT NULL,
    watched_seconds numeric DEFAULT 0 NOT NULL
);
CREATE TABLE public.app_webhook (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    app_id text NOT NULL,
    event text NOT NULL,
    url text NOT NULL,
    enabled boolean DEFAULT false NOT NULL
);
CREATE VIEW public.appointment_enrollment AS
 SELECT (product.target)::uuid AS appointment_plan_id,
    order_log.member_id,
    order_product.started_at,
    order_product.ended_at,
    order_product.id AS order_product_id,
    (order_product.deliverables ->> 'start_url'::text) AS start_url,
    (order_product.deliverables ->> 'join_url'::text) AS join_url,
    (order_log.invoice_options ->> 'name'::text) AS member_name,
    (order_log.invoice_options ->> 'email'::text) AS member_email,
    (order_log.invoice_options ->> 'phone'::text) AS member_phone,
    (order_product.options ->> 'appointmentResult'::text) AS result,
    (order_product.options ->> 'appointmentIssue'::text) AS issue,
    order_log.created_at,
    (order_product.options ->> 'appointmentCanceledAt'::text) AS canceled_at,
    order_product.id
   FROM ((public.order_log
     JOIN public.order_product ON (((order_product.delivered_at < now()) AND (order_product.order_id = order_log.id))))
     JOIN public.product ON (((product.id = order_product.product_id) AND (product.type = 'AppointmentPlan'::text))));
CREATE TABLE public.appointment_plan (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    duration numeric NOT NULL,
    price numeric DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    creator_id text NOT NULL,
    published_at timestamp with time zone,
    phone text,
    support_locales jsonb,
    currency_id text DEFAULT 'TWD'::text NOT NULL,
    is_private boolean DEFAULT false NOT NULL,
    reservation_amount numeric DEFAULT 0 NOT NULL,
    reservation_type text
);
COMMENT ON COLUMN public.appointment_plan.duration IS 'minutes';
COMMENT ON COLUMN public.appointment_plan.reservation_type IS 'hour / day';
CREATE VIEW public.appointment_plan_enrollment AS
 SELECT (product.target)::uuid AS appointment_plan_id,
    order_product.started_at
   FROM (public.product
     JOIN public.order_product ON (((order_product.product_id = product.id) AND (product.type = 'AppointmentPlan'::text) AND ((order_product.options -> 'appointmentCanceledAt'::text) IS NULL) AND (order_product.delivered_at < now()))));
CREATE TABLE public.appointment_schedule (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    appointment_plan_id uuid NOT NULL,
    started_at timestamp with time zone NOT NULL,
    interval_type text,
    interval_amount integer,
    excludes jsonb DEFAULT jsonb_build_array() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON COLUMN public.appointment_schedule.interval_type IS 'Y / M / W / D';
COMMENT ON COLUMN public.appointment_schedule.excludes IS 'ISO8601[], ex: ["2019-01-01T12:34:56+0800"]';
CREATE VIEW public.appointment_period AS
 SELECT t.appointment_plan_id,
    t.appointment_schedule_id,
    t.started_at,
    (t.started_at + (concat(appointment_plan.duration, 'minute'))::interval) AS ended_at,
    t.available,
    t.booked
   FROM (public.appointment_plan
     JOIN ( SELECT t1.appointment_plan_id,
            t1.appointment_schedule_id,
            t1.started_at,
                CASE COALESCE(t2.available, true)
                    WHEN (COALESCE(t3.booked, false) = true) THEN false
                    ELSE COALESCE(t2.available, true)
                END AS available,
            COALESCE(t3.booked, false) AS booked
           FROM ((( SELECT appointment_schedule.appointment_plan_id,
                    appointment_schedule.id AS appointment_schedule_id,
                    appointment_schedule.started_at
                   FROM public.appointment_schedule
                UNION
                 SELECT appointment_schedule.appointment_plan_id,
                    appointment_schedule.id AS appointment_schedule_id,
                    generate_series(appointment_schedule.started_at, (appointment_schedule.started_at + '3 mons'::interval), (concat(appointment_schedule.interval_amount,
                        CASE
                            WHEN (appointment_schedule.interval_type = 'Y'::text) THEN 'year'::text
                            WHEN (appointment_schedule.interval_type = 'M'::text) THEN 'month'::text
                            WHEN (appointment_schedule.interval_type = 'W'::text) THEN 'week'::text
                            WHEN (appointment_schedule.interval_type = 'D'::text) THEN 'day'::text
                            ELSE NULL::text
                        END))::interval) AS started_at
                   FROM public.appointment_schedule
                  WHERE (appointment_schedule.interval_amount > 0)) t1
             LEFT JOIN ( SELECT appointment_schedule.id,
                    (jsonb_array_elements_text(appointment_schedule.excludes))::timestamp without time zone AS started_at,
                    false AS available
                   FROM public.appointment_schedule) t2 ON (((t2.id = t1.appointment_schedule_id) AND (t1.started_at = t2.started_at))))
             LEFT JOIN ( SELECT appointment_plan_enrollment.appointment_plan_id,
                    appointment_plan_enrollment.started_at,
                    true AS booked
                   FROM public.appointment_plan_enrollment) t3 ON (((t3.appointment_plan_id = t1.appointment_plan_id) AND (t3.started_at = t1.started_at))))) t ON ((t.appointment_plan_id = appointment_plan.id)));
CREATE TABLE public.attend (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    member_id text NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    ended_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE public.audit_log (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    member_id text,
    type text,
    target text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    options jsonb
);
COMMENT ON COLUMN public.audit_log.type IS 'MemberManager';
CREATE TABLE public.bundle (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    title text NOT NULL,
    "salePrice" numeric NOT NULL,
    "listPrice" numeric NOT NULL,
    started_at timestamp with time zone,
    ended_at timestamp with time zone,
    sold_at timestamp with time zone,
    type integer DEFAULT 1 NOT NULL,
    period_type text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    description text
);
COMMENT ON COLUMN public.bundle.type IS '1 - perpetual / 2 - subscribe from now / 3 - subscribe all';
CREATE TABLE public.bundle_item (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    bundle_id uuid NOT NULL,
    class text NOT NULL,
    target jsonb NOT NULL
);
CREATE TABLE public.card (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    app_id text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    template text NOT NULL,
    creator_id text
);
CREATE TABLE public.card_discount (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    card_id uuid NOT NULL,
    product_id text NOT NULL,
    amount numeric NOT NULL,
    type text NOT NULL
);
COMMENT ON COLUMN public.card_discount.type IS 'cash / percentage';
CREATE VIEW public.card_enrollment AS
 SELECT (product.target)::uuid AS card_id,
    order_log.member_id,
    max(order_log.updated_at) AS updated_at
   FROM ((public.order_log
     JOIN public.order_product ON (((order_product.delivered_at < now()) AND (order_product.order_id = order_log.id) AND ((order_product.ended_at IS NULL) OR (order_product.ended_at > now())) AND ((order_product.started_at IS NULL) OR (order_product.started_at <= now())))))
     JOIN public.product ON (((product.id = order_product.product_id) AND (product.type = 'Card'::text))))
  GROUP BY (product.target)::uuid, order_log.member_id, order_product.started_at;
CREATE TABLE public.cart_item (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    fingerprint text NOT NULL,
    class text NOT NULL,
    target jsonb NOT NULL,
    app_id text NOT NULL
);
CREATE TABLE public.cart_product (
    member_id text NOT NULL,
    product_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    app_id text NOT NULL
);
CREATE TABLE public.certificate (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    certificate_template_id uuid,
    qualification text,
    period_type text,
    period_amount numeric,
    author_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    published_at timestamp with time zone,
    deleted_at timestamp with time zone,
    code text,
    app_id text NOT NULL
);
CREATE TABLE public.certificate_template (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    app_id text NOT NULL,
    template text NOT NULL,
    background_image text NOT NULL,
    author_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    title text NOT NULL
);
COMMENT ON TABLE public.certificate_template IS 'template of certificate';
CREATE TABLE public.coin_log (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    member_id text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    note text,
    amount numeric NOT NULL,
    started_at timestamp with time zone,
    ended_at timestamp with time zone
);
CREATE VIEW public.coin_status AS
 SELECT coin_log.id AS coin_id,
    coin_log.member_id,
    coin_log.amount,
    COALESCE(t.used_coins, (0)::numeric) AS used_coins,
    (coin_log.amount - COALESCE(t.used_coins, (0)::numeric)) AS remaining
   FROM (public.coin_log
     LEFT JOIN ( SELECT (order_discount.target)::uuid AS coin_id,
            sum((COALESCE((order_discount.options ->> 'coins'::text), '0'::text))::numeric) AS used_coins
           FROM (public.order_discount
             JOIN public.order_log ON (((order_log.id = order_discount.order_id) AND (order_log.status = 'SUCCESS'::text) AND (order_discount.type = 'Coin'::text))))
          GROUP BY (order_discount.target)::uuid) t ON ((t.coin_id = coin_log.id)))
  WHERE (((coin_log.started_at IS NULL) OR (now() >= coin_log.started_at)) AND ((coin_log.ended_at IS NULL) OR (now() <= coin_log.ended_at)));
CREATE VIEW public.coin_usage_export AS
SELECT
    NULL::text AS app_id,
    NULL::uuid AS member_contract_id,
    NULL::timestamp with time zone AS invoice_issued_at,
    NULL::text AS invoice_number,
    NULL::text AS member_id,
    NULL::text AS email,
    NULL::text AS name,
    NULL::timestamp with time zone AS agreed_at,
    NULL::numeric AS price,
    NULL::jsonb AS coin_logs,
    NULL::jsonb AS discount_log;
CREATE TABLE public.comment (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    app_id text NOT NULL,
    thread_id text NOT NULL,
    member_id text NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.comment_reaction (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    comment_id uuid NOT NULL,
    member_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.comment_reply (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    comment_id uuid NOT NULL,
    member_id text NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.comment_reply_reaction (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    comment_reply_id uuid NOT NULL,
    member_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.contract (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    deliverables text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    template text DEFAULT '<div></div>'::text NOT NULL,
    revocation text,
    published_at timestamp with time zone,
    options jsonb,
    app_id text NOT NULL
);
CREATE TABLE public.coupon_plan_product (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    coupon_plan_id uuid NOT NULL,
    product_id text NOT NULL
);
CREATE VIEW public.coupon_status AS
 SELECT DISTINCT coupon.id AS coupon_id,
    (((coupon_plan.started_at IS NOT NULL) AND (coupon_plan.started_at > now())) OR ((coupon_plan.ended_at IS NOT NULL) AND (coupon_plan.ended_at < now()))) AS outdated,
    (t.order_id IS NOT NULL) AS used
   FROM (((public.coupon
     JOIN public.coupon_code ON ((coupon.coupon_code_id = coupon_code.id)))
     JOIN public.coupon_plan ON ((coupon_code.coupon_plan_id = coupon_plan.id)))
     LEFT JOIN ( SELECT order_discount.target,
            order_discount.order_id,
            order_log.status
           FROM (public.order_discount
             JOIN public.order_log ON (((order_log.id = order_discount.order_id) AND (order_log.status = 'SUCCESS'::text))))) t ON (((coupon.id)::text = t.target)));
CREATE TABLE public.creator_display (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    block_id text DEFAULT 'default'::text NOT NULL,
    member_id text NOT NULL,
    "position" integer DEFAULT '-1'::integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE VIEW public.creator AS
 SELECT creator.id,
    creator_display.block_id,
    creator_display."position",
    creator_display.updated_at AS published_at,
    creator.name,
    creator.picture_url
   FROM (( SELECT member.id,
            member.app_id,
            member.roles_deprecated,
            member.name,
            member.email,
            member.picture_url,
            member.metadata,
            member.description,
            member.created_at,
            member.logined_at,
            member.username,
            member.passhash,
            member.facebook_user_id,
            member.google_user_id,
            member.abstract,
            member.title,
            member.role,
            member.refresh_token,
            member.zoom_user_id_deprecate,
            member.youtube_channel_ids,
            member.manager_id,
            member.assigned_at,
            member.star
           FROM public.member
          WHERE (member.role = 'content-creator'::text)) creator
     LEFT JOIN public.creator_display ON ((creator.id = creator_display.member_id)));
CREATE TABLE public.creator_category (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    creator_id text NOT NULL,
    category_id text NOT NULL,
    "position" integer DEFAULT '-1'::integer NOT NULL
);
CREATE TABLE public.currency (
    id text NOT NULL,
    label text NOT NULL,
    unit text NOT NULL,
    name text NOT NULL,
    minor_units integer DEFAULT 0
);
CREATE TABLE public.email_template (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.estimator (
    id text DEFAULT public.gen_random_uuid() NOT NULL,
    name text NOT NULL,
    list_price numeric NOT NULL,
    sale_price numeric,
    sold_at timestamp with time zone,
    published_at timestamp with time zone,
    source_url text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.exam (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    abstract text,
    point numeric NOT NULL,
    passing_score numeric NOT NULL,
    applicable_plan_id uuid,
    examinable_unit text,
    examinable_amount numeric,
    examinable_started_at timestamp with time zone,
    examinable_ended_at timestamp with time zone,
    time_limit_unit text,
    time_limit_amount numeric,
    is_available_to_retry boolean DEFAULT false NOT NULL,
    is_available_to_go_back boolean DEFAULT false NOT NULL,
    is_available_announce_score boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    app_id text NOT NULL
);
COMMENT ON COLUMN public.exam.examinable_unit IS 'd, h, m';
CREATE TABLE public.exam_member_time_limit (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    exam_id uuid NOT NULL,
    member_id text NOT NULL,
    expired_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    editor_id uuid
);
CREATE TABLE public.exam_question_group (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    exam_id uuid NOT NULL,
    question_group_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.exercise (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    member_id text NOT NULL,
    program_content_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    answer jsonb,
    exam_id uuid,
    started_at timestamp with time zone,
    ended_at timestamp with time zone
);
CREATE VIEW public.exercise_public AS
 SELECT "extract".exercise_id,
    "extract".program_content_id,
    "extract".member_id,
    "extract".started_at,
    "extract".ended_at,
    "extract".question_id,
    "extract".question_points,
    "extract".gained_points,
    "extract".is_correct,
    "extract".question_started_at,
    "extract".question_ended_at,
        CASE
            WHEN (("extract".question_started_at IS NULL) OR ("extract".question_ended_at IS NULL)) THEN NULL::double precision
            ELSE date_part('epoch'::text, (("extract".question_ended_at)::timestamp without time zone - ("extract".question_started_at)::timestamp without time zone))
        END AS duration,
    regexp_replace(btrim("extract".choice_ids, '[]'::text), '\"'::text, ''::text, 'g'::text) AS choice_ids
   FROM ( SELECT exercise.id AS exercise_id,
            exercise.member_id,
            exercise.program_content_id,
            exercise.started_at,
            exercise.ended_at,
            (e_answer.value ->> 'questionId'::text) AS question_id,
            (e_answer.value ->> 'questionPoints'::text) AS question_points,
            (e_answer.value ->> 'gainedPoints'::text) AS gained_points,
                CASE
                    WHEN ((e_answer.value ->> 'questionPoints'::text) = (e_answer.value ->> 'gainedPoints'::text)) THEN 'true'::text
                    ELSE 'false'::text
                END AS is_correct,
            (e_answer.value ->> 'startedAt'::text) AS question_started_at,
            (e_answer.value ->> 'endedAt'::text) AS question_ended_at,
            (e_answer.value ->> 'choiceIds'::text) AS choice_ids
           FROM (public.exercise
             CROSS JOIN LATERAL json_array_elements((exercise.answer)::json) e_answer(value))
          WHERE (exercise.answer IS NOT NULL)) "extract";
CREATE TABLE public.file (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    name text NOT NULL,
    excerpt text NOT NULL,
    uri text NOT NULL,
    size numeric NOT NULL,
    status text NOT NULL,
    checksum text NOT NULL,
    mime_type text NOT NULL,
    metadata jsonb DEFAULT jsonb_build_object() NOT NULL,
    thumbnail text,
    acl text DEFAULT 'OWNED'::text NOT NULL,
    viewed_count integer DEFAULT 0 NOT NULL,
    viewed_at timestamp with time zone,
    starred_at timestamp with time zone,
    created_by text NOT NULL,
    updated_by text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    purge_at timestamp with time zone,
    CONSTRAINT file_acl_constraint CHECK ((acl = ANY (ARRAY['ANONYMOUS'::text, 'AUTHENTICATED'::text, 'AUTHORIZED'::text, 'OWNED'::text]))),
    CONSTRAINT file_status_constraint CHECK ((status = ANY (ARRAY['SUCCESS'::text, 'FAILED'::text, 'DELETED'::text, 'QUEUED'::text, 'PROCESSING'::text])))
);
CREATE TABLE public.gift_plan (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    app_id text NOT NULL,
    title text NOT NULL,
    editor_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
COMMENT ON TABLE public.gift_plan IS '贈品方案';
CREATE TABLE public.gift_plan_product (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    gift_plan_id uuid NOT NULL,
    product_id text NOT NULL
);
COMMENT ON TABLE public.gift_plan_product IS '贈品方案產品';
CREATE TABLE public.identity (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    app_id text NOT NULL,
    type text NOT NULL,
    name text NOT NULL,
    "position" integer DEFAULT 0 NOT NULL
);
CREATE TABLE public.invoice (
    order_id text NOT NULL,
    no text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    price numeric,
    options jsonb,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    executor_id uuid
);
CREATE TABLE public.issue (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    app_id text NOT NULL,
    thread_id text NOT NULL,
    member_id text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    solved_at timestamp with time zone,
    is_public boolean DEFAULT false NOT NULL
);
CREATE VIEW public.issue_enrollment AS
 SELECT issue.id AS issue_id,
    program_content.id AS program_content_id,
    program_content_section.id AS program_content_section_id,
    program_content_section.program_id
   FROM ((public.issue
     LEFT JOIN public.program_content ON ((issue.thread_id ~~ concat('%', (program_content.id)::text, '%'))))
     LEFT JOIN public.program_content_section ON ((program_content_section.id = program_content.content_section_id)));
CREATE TABLE public.issue_reaction (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    issue_id uuid NOT NULL,
    member_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.issue_reply (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    issue_id uuid NOT NULL,
    member_id text NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.issue_reply_reaction (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    issue_reply_id uuid NOT NULL,
    member_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.iszn_coupon (
    startedat timestamp with time zone,
    endedat timestamp with time zone,
    amount integer NOT NULL,
    count integer NOT NULL,
    "constraint" integer,
    description text,
    id text NOT NULL,
    title text NOT NULL,
    type integer
);
CREATE TABLE public.iszn_coupon_usage (
    id uuid NOT NULL,
    userid text NOT NULL,
    couponid text NOT NULL,
    addedat timestamp with time zone,
    orderid uuid,
    "unique" text NOT NULL
);
CREATE TABLE public.iszn_coursecontent (
    id uuid NOT NULL,
    title text NOT NULL,
    istrial boolean NOT NULL,
    createdat timestamp with time zone NOT NULL,
    updatedat timestamp with time zone NOT NULL,
    "order" integer NOT NULL,
    unitid uuid NOT NULL,
    courseresourceid uuid,
    duration numeric
);
CREATE TABLE public.iszn_coursediscussion (
    id uuid NOT NULL,
    coursecontentid uuid NOT NULL,
    userid text NOT NULL,
    content text NOT NULL,
    createdat timestamp with time zone NOT NULL,
    updatedat timestamp with time zone NOT NULL,
    solvedat timestamp with time zone
);
CREATE TABLE public.iszn_coursediscussionreaction (
    id uuid NOT NULL,
    userid text NOT NULL,
    coursediscussionid uuid NOT NULL
);
CREATE TABLE public.iszn_coursereply (
    id uuid NOT NULL,
    coursediscussionid uuid NOT NULL,
    userid text NOT NULL,
    content text NOT NULL,
    createdat timestamp with time zone NOT NULL,
    updatedat timestamp with time zone NOT NULL
);
CREATE TABLE public.iszn_coursereplyreaction (
    id uuid NOT NULL,
    userid text NOT NULL,
    coursereplyid uuid NOT NULL
);
CREATE TABLE public.iszn_courseunit (
    id uuid NOT NULL,
    title text NOT NULL,
    courseid uuid NOT NULL,
    "order" integer NOT NULL
);
CREATE TABLE public.iszn_invoice (
    buyername text NOT NULL,
    buyerubn text NOT NULL,
    buyeraddress text NOT NULL,
    buyeremail text NOT NULL,
    category text NOT NULL,
    carriertype text NOT NULL,
    carriernum text NOT NULL,
    lovecode text NOT NULL,
    id uuid NOT NULL
);
CREATE TABLE public.iszn_order (
    id uuid NOT NULL,
    status text NOT NULL,
    userid text NOT NULL,
    createdat timestamp with time zone NOT NULL,
    updatedat timestamp with time zone NOT NULL,
    paymenttype text,
    merchantorderno text,
    invoiceid uuid,
    message text,
    totalamount bigint
);
CREATE TABLE public.iszn_order_item (
    id uuid NOT NULL,
    orderid uuid NOT NULL,
    courseid uuid NOT NULL
);
CREATE TABLE public.iszn_user (
    id text NOT NULL,
    name text,
    email text NOT NULL,
    picture text,
    profile text,
    email_verified boolean,
    loginedat timestamp with time zone,
    createdat timestamp with time zone,
    address text,
    age numeric,
    status text,
    updatedat timestamp with time zone
);
CREATE TABLE public.member_contract (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    member_id text NOT NULL,
    contract_id uuid NOT NULL,
    started_at timestamp with time zone,
    ended_at timestamp with time zone,
    "values" jsonb,
    agreed_at timestamp with time zone,
    agreed_ip text,
    agreed_options jsonb,
    revoked_at timestamp with time zone,
    revocation_values jsonb,
    options jsonb,
    author_id text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE public.member_note (
    id text DEFAULT public.gen_random_uuid() NOT NULL,
    member_id text,
    author_id text NOT NULL,
    type text,
    status text,
    duration integer DEFAULT 0 NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    metadata jsonb,
    note text,
    rejected_at timestamp with time zone,
    deleted_at timestamp with time zone,
    deleted_from text
);
COMMENT ON COLUMN public.member_note.type IS 'NULL | inbound | outbound | demo';
COMMENT ON COLUMN public.member_note.status IS 'NULL | answered | missed';
CREATE TABLE public.member_task (
    id text DEFAULT public.gen_random_uuid() NOT NULL,
    title text NOT NULL,
    priority text DEFAULT 'high'::text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    due_at timestamp with time zone,
    description text,
    member_id text NOT NULL,
    executor_id text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    category_id text,
    author_id text
);
COMMENT ON COLUMN public.member_task.priority IS 'high / medium / low';
COMMENT ON COLUMN public.member_task.status IS 'pending / in-progress / done';
CREATE VIEW public.lead_status AS
 WITH all_members AS (
         SELECT member.id,
            member.star,
            member.manager_id,
            member.created_at
           FROM public.member
          WHERE ((member.role = 'general-member'::text) AND (member.manager_id IS NOT NULL))
        ), contacted_member AS (
         SELECT DISTINCT member_note.member_id AS id
           FROM public.member_note
        ), invited_member AS (
         SELECT DISTINCT member_task.member_id AS id
           FROM (public.member_task
             JOIN public.category ON (((category.id = member_task.category_id) AND (category.name = '預約DEMO'::text))))
        ), presented_member AS (
         SELECT DISTINCT member_note.member_id AS id
           FROM public.member_note
          WHERE (member_note.type = 'demo'::text)
        ), paid_member AS (
         SELECT order_log.member_id AS id,
            sum(payment_log.price) AS paid
           FROM (public.order_log
             JOIN public.payment_log ON (((payment_log.order_id = order_log.id) AND (payment_log.status = 'SUCCESS'::text) AND (payment_log.price > (0)::numeric))))
          GROUP BY order_log.member_id
        ), having_contract_member AS (
         SELECT DISTINCT mc.member_id AS id
           FROM public.member_contract mc
          WHERE ((mc.agreed_at IS NOT NULL) AND (mc.revoked_at IS NULL))
        ), recent_contacted_member AS (
         SELECT DISTINCT member_note.member_id AS id,
            member_note.author_id,
            max(member_note.created_at) OVER (PARTITION BY member_note.member_id) AS recent_contacted_at
           FROM public.member_note
          WHERE (member_note.created_at >= (now() - '1 mon'::interval))
        ), recent_tasked_member AS (
         SELECT DISTINCT member_task.member_id AS id,
            member_task.author_id,
            max(member_task.due_at) OVER (PARTITION BY member_task.member_id) AS recent_tasked_at
           FROM public.member_task
          WHERE (member_task.due_at >= (now() - '7 days'::interval))
        )
 SELECT all_members.id AS member_id,
        CASE
            WHEN (all_members.star < ('-999'::integer)::numeric) THEN 'DEAD'::text
            WHEN (all_members.star = ('-999'::integer)::numeric) THEN 'CLOSED'::text
            WHEN (having_contract_member.id IS NOT NULL) THEN 'SIGNED'::text
            WHEN (presented_member.* IS NOT NULL) THEN 'PRESENTED'::text
            WHEN (invited_member.* IS NOT NULL) THEN 'INVITED'::text
            WHEN (contacted_member.* IS NOT NULL) THEN 'CONTACTED'::text
            ELSE 'IDLED'::text
        END AS status,
    COALESCE(paid_member.paid, (0)::numeric) AS paid,
    recent_contacted_member.recent_contacted_at,
    recent_tasked_member.recent_tasked_at,
    all_members.manager_id,
    all_members.created_at
   FROM (((((((all_members
     LEFT JOIN contacted_member ON ((contacted_member.id = all_members.id)))
     LEFT JOIN invited_member ON ((invited_member.id = all_members.id)))
     LEFT JOIN presented_member ON ((presented_member.id = all_members.id)))
     LEFT JOIN having_contract_member ON ((having_contract_member.id = all_members.id)))
     LEFT JOIN paid_member ON ((paid_member.id = all_members.id)))
     LEFT JOIN recent_contacted_member ON (((recent_contacted_member.id = all_members.id) AND (recent_contacted_member.author_id = all_members.manager_id))))
     LEFT JOIN recent_tasked_member ON (((recent_tasked_member.id = all_members.id) AND (recent_tasked_member.author_id = all_members.manager_id))));
CREATE VIEW public.lead_status_new AS
 WITH all_members AS (
         SELECT member.id,
            member.star,
            member.manager_id,
            member.created_at
           FROM public.member
          WHERE ((member.role = 'general-member'::text) AND (member.manager_id IS NOT NULL))
        ), contacted_member AS (
         SELECT DISTINCT member_note.member_id AS id
           FROM public.member_note
        ), invited_member AS (
         SELECT DISTINCT member_task.member_id AS id
           FROM (public.member_task
             JOIN public.category ON (((category.id = member_task.category_id) AND (category.name = '預約DEMO'::text))))
        ), presented_member AS (
         SELECT DISTINCT member_note.member_id AS id
           FROM public.member_note
          WHERE (member_note.type = 'demo'::text)
        ), paid_member AS (
         SELECT order_log.member_id AS id,
            sum(payment_log.price) AS paid
           FROM (public.order_log
             JOIN public.payment_log ON (((payment_log.order_id = order_log.id) AND (payment_log.status = 'SUCCESS'::text) AND (payment_log.price > (0)::numeric))))
          GROUP BY order_log.member_id
        ), having_contract_member AS (
         SELECT DISTINCT mc.member_id AS id
           FROM public.member_contract mc
          WHERE ((mc.agreed_at IS NOT NULL) AND (mc.revoked_at IS NULL))
        ), recent_contacted_member AS (
         SELECT DISTINCT member_note.member_id AS id,
            member_note.author_id,
            max(member_note.created_at) OVER (PARTITION BY member_note.member_id) AS recent_contacted_at
           FROM public.member_note
          WHERE (member_note.created_at >= (now() - '1 mon'::interval))
        ), recent_tasked_member AS (
         SELECT DISTINCT member_task.member_id AS id,
            member_task.author_id,
            max(member_task.due_at) OVER (PARTITION BY member_task.member_id) AS recent_tasked_at
           FROM public.member_task
          WHERE (member_task.due_at >= (now() - '7 days'::interval))
        )
 SELECT all_members.id AS member_id,
        CASE
            WHEN (all_members.star < ('-999'::integer)::numeric) THEN 'DEAD'::text
            WHEN (all_members.star = ('-999'::integer)::numeric) THEN 'CLOSED'::text
            WHEN (having_contract_member.id IS NOT NULL) THEN 'SIGNED'::text
            WHEN (presented_member.* IS NOT NULL) THEN 'PRESENTED'::text
            WHEN (invited_member.* IS NOT NULL) THEN 'INVITED'::text
            WHEN (contacted_member.* IS NOT NULL) THEN 'CONTACTED'::text
            ELSE 'IDLED'::text
        END AS status,
    COALESCE(paid_member.paid, (0)::numeric) AS paid,
    recent_contacted_member.recent_contacted_at,
    recent_tasked_member.recent_tasked_at,
    all_members.manager_id,
    all_members.created_at
   FROM (((((((all_members
     LEFT JOIN contacted_member ON ((contacted_member.id = all_members.id)))
     LEFT JOIN invited_member ON ((invited_member.id = all_members.id)))
     LEFT JOIN presented_member ON ((presented_member.id = all_members.id)))
     LEFT JOIN having_contract_member ON ((having_contract_member.id = all_members.id)))
     LEFT JOIN paid_member ON ((paid_member.id = all_members.id)))
     LEFT JOIN recent_contacted_member ON (((recent_contacted_member.id = all_members.id) AND (recent_contacted_member.author_id = all_members.manager_id))))
     LEFT JOIN recent_tasked_member ON (((recent_tasked_member.id = all_members.id) AND (recent_tasked_member.author_id = all_members.manager_id))));
CREATE MATERIALIZED VIEW public.learning_overview AS
 WITH app_member_count AS (
         SELECT member.app_id,
            count(member.id) AS total_member_count
           FROM public.member
          GROUP BY member.app_id
        ), app_order_product_count AS (
         SELECT member.app_id,
            count(DISTINCT member.id) AS enrolled_member_count
           FROM ((public.member
             JOIN public.order_log ON ((member.id = order_log.member_id)))
             JOIN public.order_product ON (((order_log.id = order_product.order_id) AND (order_product.product_id ~~ 'Program%'::text))))
          GROUP BY member.app_id
        ), app_exercised_member_count AS (
         SELECT member.app_id,
            count(DISTINCT exercise.member_id) AS exercised_member_count
           FROM (public.exercise
             JOIN public.member ON ((member.id = exercise.member_id)))
          GROUP BY member.app_id
        ), app_passed_member AS (
         SELECT member.app_id,
            count(DISTINCT member.id) AS passed_member_count
           FROM (( SELECT eps.id,
                    eps.member_id,
                        CASE
                            WHEN (egp.gained_points > (eps.passing_score)::numeric) THEN true
                            ELSE false
                        END AS passed
                   FROM (( SELECT exercise.id,
                            exercise.member_id,
                            (program_content.metadata -> 'passingScore'::text) AS passing_score
                           FROM (public.exercise
                             JOIN public.program_content ON ((program_content.id = exercise.program_content_id)))
                          WHERE (exercise.answer IS NOT NULL)) eps
                     JOIN ( SELECT m.id,
                            sum(m.gained_points) AS gained_points
                           FROM ( SELECT exercise.id,
                                    ((e_answer.value ->> 'gainedPoints'::text))::numeric AS gained_points
                                   FROM (public.exercise
                                     CROSS JOIN LATERAL json_array_elements((exercise.answer)::json) e_answer(value))) m
                          GROUP BY m.id) egp ON ((eps.id = egp.id)))) t
             JOIN public.member ON (((member.id = t.member_id) AND (t.passed IS TRUE))))
          GROUP BY member.app_id
        )
 SELECT app_member_count.app_id,
    app_member_count.total_member_count,
    COALESCE(app_order_product_count.enrolled_member_count, (0)::bigint) AS enrolled_member_count,
    COALESCE(app_exercised_member_count.exercised_member_count, (0)::bigint) AS exercised_member_count,
    COALESCE(app_passed_member.passed_member_count, (0)::bigint) AS passed_member_count
   FROM (((app_member_count
     LEFT JOIN app_order_product_count ON ((app_order_product_count.app_id = app_member_count.app_id)))
     LEFT JOIN app_exercised_member_count ON ((app_exercised_member_count.app_id = app_member_count.app_id)))
     LEFT JOIN app_passed_member ON ((app_passed_member.app_id = app_member_count.app_id)))
  WITH NO DATA;
CREATE TABLE public.locale (
    key text NOT NULL,
    zh text NOT NULL,
    zh_cn text NOT NULL,
    en text NOT NULL,
    vi text NOT NULL,
    zh_acsi text NOT NULL
);
CREATE TABLE public.order_executor (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    order_id text NOT NULL,
    member_id text NOT NULL,
    ratio numeric DEFAULT 1 NOT NULL
);
CREATE VIEW public.order_executor_sharing AS
SELECT
    NULL::uuid AS order_executor_id,
    NULL::text AS executor_id,
    NULL::text AS order_id,
    NULL::numeric AS total_price,
    NULL::numeric AS ratio,
    NULL::timestamp with time zone AS created_at;
CREATE VIEW public.manager_score AS
 WITH sales AS (
         SELECT DISTINCT member.app_id,
            unique_members.member_id
           FROM (( SELECT DISTINCT order_executor.member_id
                   FROM public.order_executor) unique_members
             JOIN public.member ON ((unique_members.member_id = member.id)))
        ), manager_performance AS (
         SELECT t.manager_id,
            ((sum(t.performance))::integer / 150000) AS performance_score
           FROM ( SELECT order_executor_sharing.executor_id AS manager_id,
                    (sum((order_executor_sharing.total_price * order_executor_sharing.ratio)) * 0.5) AS performance
                   FROM public.order_executor_sharing
                  WHERE ((order_executor_sharing.created_at >= (now() - '3 mons'::interval)) AND (order_executor_sharing.created_at <= (now() - '1 mon'::interval)))
                  GROUP BY order_executor_sharing.executor_id
                UNION ALL
                 SELECT order_executor_sharing.executor_id AS manager_id,
                    (sum((order_executor_sharing.total_price * order_executor_sharing.ratio)) * 0.8) AS performance
                   FROM public.order_executor_sharing
                  WHERE ((order_executor_sharing.created_at >= (now() - '1 mon'::interval)) AND (order_executor_sharing.created_at <= (now() - '14 days'::interval)))
                  GROUP BY order_executor_sharing.executor_id
                UNION ALL
                 SELECT order_executor_sharing.executor_id AS manager_id,
                    (sum((order_executor_sharing.total_price * order_executor_sharing.ratio)) * 1.2) AS performance
                   FROM public.order_executor_sharing
                  WHERE (order_executor_sharing.created_at >= (now() - '14 days'::interval))
                  GROUP BY order_executor_sharing.executor_id) t
          GROUP BY t.manager_id
        ), manager_effort AS (
         SELECT t.manager_id,
            sum(t.effort) AS effort_score
           FROM ( SELECT member_note.author_id AS manager_id,
                    (count(*) / 10) AS effort
                   FROM public.member_note
                  WHERE ((member_note.created_at >= (now() - '14 days'::interval)) AND (member_note.type = 'outbound'::text) AND (member_note.status = 'answered'::text) AND (member_note.duration > 30))
                  GROUP BY member_note.author_id, (date(member_note.created_at))
                 HAVING ((count(*) > 30) AND (sum(member_note.duration) > (120 * 60)))
                UNION ALL
                 SELECT member_note.author_id AS manager_id,
                    ((sum(member_note.duration) / 40) / 60) AS effort
                   FROM public.member_note
                  WHERE ((member_note.created_at >= (now() - '14 days'::interval)) AND (member_note.type = 'outbound'::text) AND (member_note.status = 'answered'::text) AND (member_note.duration > 30))
                  GROUP BY member_note.author_id, (date(member_note.created_at))
                 HAVING ((count(*) > 30) AND (sum(member_note.duration) > (120 * 60)))) t
          GROUP BY t.manager_id
        ), manager_invitation AS (
         SELECT t.manager_id,
            sum(t.invitations) AS invitations_score
           FROM ( SELECT member_task.executor_id AS manager_id,
                    count(*) AS invitations
                   FROM (public.member_task
                     JOIN public.category ON (((category.id = member_task.category_id) AND (category.name = '預約DEMO'::text))))
                  WHERE (member_task.created_at >= (now() - '14 days'::interval))
                  GROUP BY member_task.executor_id) t
          GROUP BY t.manager_id
        )
 SELECT sales.member_id AS manager_id,
    COALESCE(manager_performance.performance_score, 0) AS performance_score,
    COALESCE(manager_effort.effort_score, (0)::numeric) AS effort_score,
    COALESCE(manager_invitation.invitations_score, (0)::numeric) AS invitations_score,
    sales.app_id
   FROM (((sales
     LEFT JOIN manager_performance ON ((manager_performance.manager_id = sales.member_id)))
     LEFT JOIN manager_effort ON ((manager_effort.manager_id = sales.member_id)))
     LEFT JOIN manager_invitation ON ((manager_invitation.manager_id = sales.member_id)));
CREATE TABLE public.media (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    member_id text NOT NULL,
    resource_url text NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    size integer NOT NULL,
    metadata jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.meet (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    name text NOT NULL,
    started_at timestamp with time zone NOT NULL,
    ended_at timestamp with time zone NOT NULL,
    nbf_at timestamp with time zone,
    exp_at timestamp with time zone,
    auto_recording boolean NOT NULL,
    options jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT started_at_ended_at_constraint CHECK ((ended_at > started_at))
);
CREATE TABLE public.member_achievement (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    member_id text NOT NULL,
    achievement_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.member_card (
    id text DEFAULT public.gen_random_uuid() NOT NULL,
    member_id text NOT NULL,
    card_info jsonb NOT NULL,
    card_secret jsonb NOT NULL,
    card_identifier text NOT NULL,
    card_holder jsonb,
    priority integer DEFAULT 0 NOT NULL
);
COMMENT ON TABLE public.member_card IS 'each member''s credit cards';
CREATE TABLE public.member_category (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    member_id text NOT NULL,
    category_id text NOT NULL,
    "position" integer NOT NULL
);
CREATE TABLE public.member_certificate (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    member_id text NOT NULL,
    number text NOT NULL,
    certificate_id uuid NOT NULL,
    "values" jsonb NOT NULL,
    delivered_at timestamp with time zone NOT NULL,
    expired_at timestamp with time zone
);
CREATE TABLE public.member_device (
    member_id text NOT NULL,
    type text,
    options jsonb DEFAULT jsonb_build_object(),
    fingerprint_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    logined_at timestamp with time zone DEFAULT now(),
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    ip_address text,
    os_name text,
    browser text,
    is_login boolean DEFAULT false NOT NULL,
    last_login_at timestamp with time zone DEFAULT now()
);
COMMENT ON TABLE public.member_device IS 'store login device per user';
CREATE TABLE public.member_permission_group (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    member_id text NOT NULL,
    permission_group_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.member_phone (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    member_id text NOT NULL,
    phone text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    is_valid boolean DEFAULT true NOT NULL
);
CREATE TABLE public.member_property (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    member_id text NOT NULL,
    property_id uuid NOT NULL,
    value text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.permission_group (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    name text NOT NULL,
    app_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE VIEW public.member_export AS
 WITH member_phones AS (
         SELECT member_phone.member_id,
            string_agg(member_phone.phone, ','::text) AS phones
           FROM public.member_phone
          GROUP BY member_phone.member_id
        ), member_categories AS (
         SELECT member_category.member_id,
            string_agg(category.name, ','::text) AS names
           FROM (public.member_category
             JOIN public.category ON ((category.id = member_category.category_id)))
          GROUP BY member_category.member_id
        ), member_tags AS (
         SELECT member_tag.member_id,
            string_agg(member_tag.tag_name, ','::text) AS names
           FROM public.member_tag
          GROUP BY member_tag.member_id
        ), member_orders AS (
         SELECT order_log.member_id,
            sum(COALESCE(order_product.price, (0)::numeric)) AS consumption
           FROM (public.order_log
             JOIN public.order_product ON ((order_product.order_id = order_log.id)))
          WHERE (order_log.status = 'SUCCESS'::text)
          GROUP BY order_log.member_id
        ), member_properties AS (
         SELECT member_property.member_id,
            jsonb_object_agg(member_property.property_id, member_property.value) AS properties
           FROM public.member_property
          GROUP BY member_property.member_id
        ), member_permission_groups AS (
         SELECT member_permission_group.member_id,
            string_agg(permission_group.name, ','::text) AS names
           FROM (public.member_permission_group
             JOIN public.permission_group ON ((permission_group.id = member_permission_group.permission_group_id)))
          GROUP BY member_permission_group.member_id
        )
 SELECT member.id,
    member.app_id,
    member.name,
    member.username,
    member.email,
    member.created_at,
    member.logined_at,
    member.role,
    COALESCE(member_phones.phones, ''::text) AS phones,
    COALESCE(member_categories.names, ''::text) AS categories,
    COALESCE(member_tags.names, ''::text) AS tags,
    COALESCE(member_orders.consumption, (0)::numeric) AS consumption,
    manager.id AS manager_id,
    COALESCE(NULLIF(manager.name, ''::text), manager.username) AS manager_name,
    COALESCE(member_properties.properties, '{}'::jsonb) AS properties,
    COALESCE(member_permission_groups.names, ''::text) AS permission_groups
   FROM (((((((public.member
     LEFT JOIN member_phones ON ((member_phones.member_id = member.id)))
     LEFT JOIN member_categories ON ((member_categories.member_id = member.id)))
     LEFT JOIN member_tags ON ((member_tags.member_id = member.id)))
     LEFT JOIN member_orders ON ((member_orders.member_id = member.id)))
     LEFT JOIN member_properties ON ((member_properties.member_id = member.id)))
     LEFT JOIN member_permission_groups ON ((member_permission_groups.member_id = member.id)))
     LEFT JOIN public.member manager ON ((manager.id = member.manager_id)))
  ORDER BY member.created_at DESC NULLS LAST;
CREATE VIEW public.member_note_attachment AS
 SELECT attachment.id AS attachment_id,
    attachment.target AS member_note_id,
    attachment.app_id,
    attachment.data,
    attachment.options,
    attachment.created_at,
    attachment.updated_at
   FROM public.attachment
  WHERE ((attachment.is_deleted = false) AND (attachment.type = 'MemberNote'::text));
CREATE VIEW public.member_order_status AS
SELECT
    NULL::text AS order_id,
    NULL::text AS product_id,
    NULL::uuid AS order_product_id,
    NULL::text AS member_id,
    NULL::timestamp without time zone AS order_product_delivered_at,
    NULL::timestamp with time zone AS order_product_ended_at,
    NULL::text AS member_name,
    NULL::text AS member_username,
    NULL::text AS member_email,
    NULL::text AS member_picture_url,
    NULL::numeric AS coin_remaining,
    NULL::bigint AS coupon_count,
    NULL::text AS coupon_plan_title,
    NULL::text AS member_note_id,
    NULL::timestamp with time zone AS member_note_created_at,
    NULL::text AS author_id,
    NULL::text AS author_name,
    NULL::text AS author_email;
CREATE TABLE public.member_permission_extra (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    member_id text NOT NULL,
    permission_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.permission_group_permission (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    permission_group_id uuid NOT NULL,
    permission_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.role_permission (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    role_id text NOT NULL,
    permission_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE VIEW public.member_permission AS
 SELECT member.id AS member_id,
    role_permission.permission_id
   FROM (public.member
     JOIN public.role_permission ON ((role_permission.role_id = member.role)))
UNION
 SELECT member.id AS member_id,
    app_default_permission.permission_id
   FROM (public.member
     JOIN public.app_default_permission ON ((app_default_permission.app_id = member.app_id)))
UNION
 SELECT member_permission_extra.member_id,
    member_permission_extra.permission_id
   FROM public.member_permission_extra
UNION
 SELECT member_permission_group.member_id,
    permission_group_permission.permission_id
   FROM ((public.member_permission_group
     JOIN public.permission_group ON ((permission_group.id = member_permission_group.permission_group_id)))
     JOIN public.permission_group_permission ON ((permission_group_permission.permission_group_id = permission_group.id)));
CREATE VIEW public.member_phone_duplicated AS
 SELECT member_phone.phone,
    count(*) AS count,
    member.app_id
   FROM (public.member_phone
     JOIN public.member ON ((member.id = member_phone.member_id)))
  GROUP BY member_phone.phone, member.app_id
 HAVING (count(*) > 1)
  ORDER BY (count(*));
CREATE VIEW public.member_public AS
SELECT
    NULL::text AS id,
    NULL::text AS name,
    NULL::text AS username,
    NULL::jsonb AS roles,
    NULL::text AS picture_url,
    NULL::text AS description,
    NULL::jsonb AS metadata,
    NULL::text AS app_id,
    NULL::text AS role,
    NULL::text AS abstract,
    NULL::jsonb AS tag_names,
    NULL::text AS zoom_user_id,
    NULL::text AS title,
    NULL::text AS email,
    NULL::timestamp with time zone AS created_at,
    NULL::text AS status,
    NULL::integer AS has_backstage_enter_permission,
    NULL::text AS manager_id;
CREATE TABLE public.member_shop (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    title text NOT NULL,
    shipping_methods jsonb,
    published_at timestamp with time zone,
    member_id text NOT NULL,
    cover_url text
);
CREATE TABLE public.member_social (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    member_id text NOT NULL,
    type text NOT NULL,
    channel_id text NOT NULL,
    channel_url text,
    name text NOT NULL,
    description text,
    profile_url text
);
COMMENT ON TABLE public.member_social IS 'Creator''s social channel';
COMMENT ON COLUMN public.member_social.type IS 'youtube';
CREATE TABLE public.member_speciality (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    member_id text NOT NULL,
    tag_name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.member_tracking_log (
    id text DEFAULT public.gen_random_uuid() NOT NULL,
    member_id text NOT NULL,
    source text,
    medium text,
    landing text,
    referrer text,
    campaign text,
    content text,
    brand text,
    adgroup text,
    adname text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.member_tracking_log IS 'track member behavior';
CREATE TABLE public.merchandise_category (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    merchandise_id uuid NOT NULL,
    category_id text NOT NULL,
    "position" integer DEFAULT 0 NOT NULL
);
CREATE TABLE public.merchandise_file (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    merchandise_id uuid NOT NULL,
    data jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.merchandise_img (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    merchandise_id uuid NOT NULL,
    url text NOT NULL,
    type text NOT NULL,
    "position" integer DEFAULT 0 NOT NULL
);
COMMENT ON COLUMN public.merchandise_img.type IS 'cover | common';
CREATE TABLE public.product_inventory (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    product_id text NOT NULL,
    specification text,
    status text,
    quantity integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    comment text
);
COMMENT ON COLUMN public.product_inventory.product_id IS '{type}_{target}, ex: Program_123-456, ProgramPlan_123-456';
COMMENT ON COLUMN public.product_inventory.status IS 'arrange';
CREATE VIEW public.product_inventory_status AS
 SELECT t.product_id,
    t.total_quantity,
    t.undelivered_quantity,
    t.delivered_quantity,
    ((t.total_quantity - t.undelivered_quantity) - t.delivered_quantity) AS buyable_quantity
   FROM ( SELECT sum_inventory.product_id,
            sum_inventory.total_quantity,
            COALESCE(undelivered_inventory.undelivered_quantity, (0)::bigint) AS undelivered_quantity,
            COALESCE(delivered_inventory.delivered_quantity, (0)::bigint) AS delivered_quantity
           FROM ((( SELECT product_inventory.product_id,
                    sum(product_inventory.quantity) AS total_quantity
                   FROM public.product_inventory
                  GROUP BY product_inventory.product_id) sum_inventory
             LEFT JOIN ( SELECT undelivered_inventory_1.product_id,
                    sum((undelivered_inventory_1.product_quantity)::integer) AS undelivered_quantity
                   FROM ( SELECT product.id AS product_id,
                            (order_product.options -> 'quantity'::text) AS product_quantity
                           FROM (public.order_product
                             JOIN public.product ON (((product.id = order_product.product_id) AND ((order_product.delivered_at IS NULL) OR (order_product.delivered_at > now())))))) undelivered_inventory_1
                  GROUP BY undelivered_inventory_1.product_id) undelivered_inventory ON ((undelivered_inventory.product_id = sum_inventory.product_id)))
             LEFT JOIN ( SELECT delivered_inventory_1.product_id,
                    sum((delivered_inventory_1.product_quantity)::integer) AS delivered_quantity
                   FROM ( SELECT product.id AS product_id,
                            (order_product.options -> 'quantity'::text) AS product_quantity
                           FROM (public.order_product
                             JOIN public.product ON (((product.id = order_product.product_id) AND (order_product.delivered_at < now()))))) delivered_inventory_1
                  GROUP BY delivered_inventory_1.product_id) delivered_inventory ON ((delivered_inventory.product_id = sum_inventory.product_id)))) t;
CREATE VIEW public.merchandise_inventory_status AS
 SELECT (product.target)::uuid AS merchandise_id,
    product_inventory_status.total_quantity,
    product_inventory_status.undelivered_quantity,
    product_inventory_status.delivered_quantity,
    product_inventory_status.buyable_quantity
   FROM (public.product_inventory_status
     JOIN public.product ON ((product.id = product_inventory_status.product_id)))
  WHERE (product.type = 'Merchandise'::text);
CREATE TABLE public.merchandise_spec (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    title text DEFAULT 'Untitled'::text NOT NULL,
    list_price numeric DEFAULT 0 NOT NULL,
    sale_price numeric,
    quota integer DEFAULT '-1'::integer NOT NULL,
    merchandise_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_deleted boolean DEFAULT false NOT NULL
);
CREATE TABLE public.merchandise_spec_file (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    data jsonb,
    merchandise_spec_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE VIEW public.merchandise_spec_inventory_status AS
 SELECT (t.target)::uuid AS merchandise_spec_id,
    t.total_quantity,
        CASE
            WHEN ((t.is_physical IS FALSE) AND (t.is_customized IS FALSE)) THEN (0)::bigint
            ELSE t.undelivered_quantity
        END AS undelivered_quantity,
        CASE
            WHEN ((t.is_physical IS FALSE) AND (t.is_customized IS FALSE)) THEN (t.undelivered_quantity + t.delivered_quantity)
            ELSE t.delivered_quantity
        END AS delivered_quantity,
    (((t.total_quantity - t.undelivered_quantity) - t.delivered_quantity) - t.unpaid_quantity) AS buyable_quantity,
    t.unpaid_quantity
   FROM ( SELECT sum_inventory.product_id,
            sum_inventory.target,
            sum_inventory.total_quantity,
            sum_inventory.is_physical,
            sum_inventory.is_customized,
            COALESCE(unpaid_inventory.unpaid_quantity, (0)::bigint) AS unpaid_quantity,
            COALESCE(undelivered_inventory.undelivered_quantity, (0)::bigint) AS undelivered_quantity,
            COALESCE(delivered_inventory.delivered_quantity, (0)::bigint) AS delivered_quantity
           FROM (((( SELECT product_inventory.product_id,
                    product.target,
                    merchandise.is_physical,
                    merchandise.is_customized,
                    sum(product_inventory.quantity) AS total_quantity
                   FROM (((public.product_inventory
                     JOIN public.product ON (((product.id = product_inventory.product_id) AND (product.type ~~ 'MerchandiseSpec%'::text))))
                     JOIN public.merchandise_spec ON ((merchandise_spec.id = (product.target)::uuid)))
                     JOIN public.merchandise ON ((merchandise.id = merchandise_spec.merchandise_id)))
                  GROUP BY product_inventory.product_id, product.target, merchandise.is_physical, merchandise.is_customized) sum_inventory
             LEFT JOIN ( SELECT unpaid_inventory_1.product_id,
                    sum((unpaid_inventory_1.product_quantity)::integer) AS unpaid_quantity
                   FROM ( SELECT product.id AS product_id,
                            (order_product.options -> 'quantity'::text) AS product_quantity
                           FROM ((public.order_log
                             JOIN public.order_product ON ((((order_log.status = 'UNPAID'::text) OR (order_log.status = 'PAYING'::text)) AND (order_product.order_id = order_log.id))))
                             JOIN public.product ON ((product.id = order_product.product_id)))) unpaid_inventory_1
                  GROUP BY unpaid_inventory_1.product_id) unpaid_inventory ON ((unpaid_inventory.product_id = sum_inventory.product_id)))
             LEFT JOIN ( SELECT undelivered_inventory_1.product_id,
                    sum((undelivered_inventory_1.product_quantity)::integer) AS undelivered_quantity
                   FROM ( SELECT product.id AS product_id,
                            (order_product.options -> 'quantity'::text) AS product_quantity
                           FROM ((public.order_product
                             JOIN public.product ON (((product.id = order_product.product_id) AND ((order_product.delivered_at IS NULL) OR (order_product.delivered_at > now())))))
                             JOIN public.order_log ON ((order_log.id = order_product.order_id)))
                          WHERE (order_log.status = 'SUCCESS'::text)) undelivered_inventory_1
                  GROUP BY undelivered_inventory_1.product_id) undelivered_inventory ON ((undelivered_inventory.product_id = sum_inventory.product_id)))
             LEFT JOIN ( SELECT delivered_inventory_1.product_id,
                    sum((delivered_inventory_1.product_quantity)::integer) AS delivered_quantity
                   FROM ( SELECT product.id AS product_id,
                            (order_product.options -> 'quantity'::text) AS product_quantity
                           FROM ((public.order_product
                             JOIN public.product ON (((product.id = order_product.product_id) AND (order_product.delivered_at < now()))))
                             JOIN public.order_log ON ((order_log.id = order_product.order_id)))
                          WHERE (order_log.status = 'SUCCESS'::text)) delivered_inventory_1
                  GROUP BY delivered_inventory_1.product_id) delivered_inventory ON ((delivered_inventory.product_id = sum_inventory.product_id)))) t;
CREATE TABLE public.migrations (
    id integer NOT NULL,
    "timestamp" bigint NOT NULL,
    name character varying NOT NULL
);
CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;
CREATE TABLE public.module (
    id text DEFAULT public.gen_random_uuid() NOT NULL,
    name text NOT NULL,
    abstract text,
    category_name text
);
CREATE TABLE public.notification (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    read_at timestamp with time zone,
    reference_url text,
    type text,
    extra text,
    target_member_id text NOT NULL,
    source_member_id text NOT NULL,
    description text NOT NULL,
    avatar text
);
CREATE TABLE public.order_contact (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    order_id text NOT NULL,
    member_id text NOT NULL,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    read_at timestamp with time zone
);
CREATE VIEW public.order_group_buying_log AS
 SELECT order_sub_log.parent_order_id,
    order_log.member_id AS parent_order_member_id,
    order_log_member.email AS parent_order_member_email,
    order_sub_log.id AS order_id,
    order_sub_log.member_id,
    order_sub_log_member.email AS member_email,
    order_product.started_at,
    order_product.ended_at,
    order_sub_log.transferred_at,
    order_product.product_id AS program_plan_id,
    order_product.name,
        CASE
            WHEN (order_product.product_id ~~ '%ProgramPlan_%'::text) THEN program.cover_url
            WHEN (order_product.product_id ~~ '%ActivityTicket_%'::text) THEN activity.cover_url
            ELSE NULL::text
        END AS cover_url
   FROM ((((((((public.order_log
     JOIN public.order_log order_sub_log ON (((order_sub_log.parent_order_id = order_log.id) AND (order_log.status = 'SUCCESS'::text))))
     JOIN public.order_product ON ((order_product.order_id = order_sub_log.id)))
     JOIN public.member order_sub_log_member ON ((order_sub_log_member.id = order_sub_log.member_id)))
     JOIN public.member order_log_member ON ((order_log_member.id = order_log.member_id)))
     LEFT JOIN public.program_plan ON ((concat('ProgramPlan_', program_plan.id) = order_product.product_id)))
     LEFT JOIN public.program ON ((program_plan.program_id = program.id)))
     LEFT JOIN public.activity_ticket ON ((concat('ActivityTicket_', activity_ticket.id) = order_product.product_id)))
     LEFT JOIN public.activity ON ((activity_ticket.activity_id = activity.id)));
CREATE TABLE public.podcast_plan (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    podcast_id uuid,
    is_subscription boolean NOT NULL,
    title text NOT NULL,
    list_price numeric NOT NULL,
    sale_price numeric,
    sold_at timestamp with time zone,
    published_at timestamp with time zone,
    period_amount numeric NOT NULL,
    period_type text NOT NULL,
    "position" integer,
    creator_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
COMMENT ON COLUMN public.podcast_plan.podcast_id IS 'we will use this in the future!!!';
CREATE VIEW public.product_owner AS
 SELECT product.id AS product_id,
    activity.organizer_id AS member_id,
    'ActivityTicket'::text AS type,
    (activity_ticket.id)::text AS target
   FROM ((public.product
     JOIN public.activity_ticket ON (((activity_ticket.id)::text = product.target)))
     JOIN public.activity ON ((activity.id = activity_ticket.activity_id)))
UNION
 SELECT product.id AS product_id,
    appointment_plan.creator_id AS member_id,
    'AppointmentPlan'::text AS type,
    (appointment_plan.id)::text AS target
   FROM (public.product
     JOIN public.appointment_plan ON (((appointment_plan.id)::text = product.target)))
UNION
 SELECT product.id AS product_id,
    card.creator_id AS member_id,
    'Card'::text AS type,
    (card.id)::text AS target
   FROM (public.product
     JOIN public.card ON (((card.id)::text = product.target)))
UNION
 SELECT product.id AS product_id,
    merchandise.member_id,
    'MemberShop'::text AS type,
    (merchandise.member_shop_id)::text AS target
   FROM (public.product
     JOIN public.merchandise ON (((merchandise.id)::text = product.target)))
UNION
 SELECT product.id AS product_id,
    member_shop.member_id,
    'MerchandiseSpec'::text AS type,
    (merchandise_spec.id)::text AS target
   FROM (((public.product
     JOIN public.merchandise_spec ON (((merchandise_spec.id)::text = product.target)))
     JOIN public.merchandise ON ((merchandise.id = merchandise_spec.merchandise_id)))
     JOIN public.member_shop ON ((member_shop.id = merchandise.member_shop_id)))
  WHERE ((merchandise.is_limited = true) OR (merchandise.is_customized = true))
UNION
 SELECT product.id AS product_id,
    podcast_plan.creator_id AS member_id,
    'PodcastPlan'::text AS type,
    (podcast_plan.id)::text AS target
   FROM (public.product
     JOIN public.podcast_plan ON (((podcast_plan.id)::text = product.target)))
UNION
 SELECT product.id AS product_id,
    podcast_program.creator_id AS member_id,
    'PodcastProgram'::text AS type,
    (podcast_program.id)::text AS target
   FROM (public.product
     JOIN public.podcast_program ON (((podcast_program.id)::text = product.target)))
UNION
 SELECT product.id AS product_id,
    program_role.member_id,
    'Program'::text AS type,
    (program.id)::text AS target
   FROM ((public.product
     JOIN public.program ON (((program.id)::text = product.target)))
     JOIN public.program_role ON ((program_role.program_id = program.id)))
  WHERE (program_role.name = 'instructor'::text)
UNION
 SELECT product.id AS product_id,
    program_package.creator_id AS member_id,
    'ProgramPackagePlan'::text AS type,
    (program_package_plan.id)::text AS target
   FROM ((public.product
     JOIN public.program_package_plan ON (((program_package_plan.id)::text = product.target)))
     JOIN public.program_package ON ((program_package.id = program_package_plan.program_package_id)))
UNION
 SELECT product.id AS product_id,
    program_role.member_id,
    'ProgramPlan'::text AS type,
    (program_plan.id)::text AS target
   FROM (((public.product
     JOIN public.program_plan ON (((program_plan.id)::text = product.target)))
     JOIN public.program ON ((program.id = program_plan.program_id)))
     JOIN public.program_role ON ((program_role.program_id = program.id)))
  WHERE (program_role.name = 'instructor'::text)
UNION
 SELECT product.id AS product_id,
    project.creator_id AS member_id,
    'ProjectPlan'::text AS type,
    (project_plan.id)::text AS target
   FROM ((public.product
     JOIN public.project_plan ON (((project_plan.id)::text = product.target)))
     JOIN public.project ON ((project.id = project_plan.project_id)));
CREATE TABLE public.sharing_code (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    app_id text NOT NULL,
    path text NOT NULL,
    code text NOT NULL,
    note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE VIEW public.order_log_export AS
 SELECT order_log.id AS order_log_id,
    order_log.status,
    order_log.created_at,
    order_log.updated_at,
    order_log.invoice_options AS invoice,
    member.app_id,
    member.id AS member_id,
    COALESCE(member.name, member.username) AS member_name,
    member.email AS member_email,
    o1.payment_no,
    o1.paid_at,
    o1.payment_options,
    o2.order_products,
    o2.order_product_num,
    o2.order_product_total_price,
    o2.sharing_codes,
    o2.sharing_notes,
    o3.order_discounts,
    o3.order_discount_total_price,
    o4.order_executors,
    (order_log.invoice_options ->> 'referrerEmail'::text) AS referrer_email,
    order_log.last_paid_at,
    order_log.shipping,
    (order_log.payment_model ->> 'gateway'::text) AS payment_gateway,
    o1.invoice_issued_at,
    o5.gift_plans,
    (order_log.options ->> 'country'::text) AS country,
    (order_log.options ->> 'countryCode'::text) AS country_code
   FROM ((((((public.order_log
     JOIN public.member ON ((member.id = order_log.member_id)))
     LEFT JOIN ( SELECT order_log_1.id AS order_log_id,
            string_agg(payment_log.no, '\n'::text ORDER BY payment_log.created_at DESC) AS payment_no,
            string_agg((payment_log.invoice_issued_at)::text, '\n'::text ORDER BY payment_log.created_at DESC) AS invoice_issued_at,
            string_agg((payment_log.paid_at)::text, '\n'::text ORDER BY payment_log.created_at DESC) AS paid_at,
            string_agg(format('%s %s'::text, COALESCE((payment_log.options ->> 'paymentMethod'::text), (payment_log.options ->> 'PaymentMethod'::text)), (payment_log.options ->> 'installmentPlan'::text)), '\n'::text ORDER BY payment_log.created_at DESC) AS payment_options
           FROM (public.order_log order_log_1
             JOIN public.payment_log ON ((payment_log.order_id = order_log_1.id)))
          GROUP BY order_log_1.id) o1 ON ((o1.order_log_id = order_log.id)))
     LEFT JOIN ( SELECT order_log_1.id AS order_log_id,
            string_agg(format('%s x %s - %s $%s'::text, order_product.name, COALESCE((order_product.options ->> 'quantity'::text), '1'::text), COALESCE(product_owners.product_owners_name, ''::text), order_product.price), '\n'::text ORDER BY order_product.created_at) AS order_products,
            sum(COALESCE(((order_product.options ->> 'quantity'::text))::integer, 1)) AS order_product_num,
            sum(order_product.price) AS order_product_total_price,
            string_agg(sharing_code.code, '\n'::text ORDER BY order_product.created_at) AS sharing_codes,
            string_agg(sharing_code.note, '\n'::text ORDER BY order_product.created_at) AS sharing_notes
           FROM (((public.order_log order_log_1
             JOIN public.order_product ON (((order_product.order_id = order_log_1.id) AND ((order_product.options ->> 'parentOrderProductId'::text) IS NULL))))
             LEFT JOIN ( SELECT product_owner.product_id,
                    string_agg(member_1.name, ', '::text) AS product_owners_name
                   FROM (public.product_owner
                     LEFT JOIN public.member member_1 ON ((member_1.id = product_owner.member_id)))
                  GROUP BY product_owner.product_id) product_owners ON ((product_owners.product_id = order_product.product_id)))
             LEFT JOIN public.sharing_code ON (((sharing_code.path = (order_product.options ->> 'from'::text)) AND (sharing_code.code = (order_product.options ->> 'sharingCode'::text)))))
          GROUP BY order_log_1.id) o2 ON ((o2.order_log_id = order_log.id)))
     LEFT JOIN ( SELECT order_log_1.id AS order_log_id,
            string_agg(format('%s $%s - %s'::text, order_discount.name, order_discount.price, coupon_code.code), '\n'::text) AS order_discounts,
            sum(order_discount.price) AS order_discount_total_price
           FROM (((public.order_log order_log_1
             JOIN public.order_discount ON ((order_discount.order_id = order_log_1.id)))
             LEFT JOIN public.coupon ON ((order_discount.target = (coupon.id)::text)))
             LEFT JOIN public.coupon_code ON ((coupon_code.id = coupon.coupon_code_id)))
          GROUP BY order_log_1.id) o3 ON ((o3.order_log_id = order_log.id)))
     LEFT JOIN ( SELECT order_log_1.id AS order_log_id,
            string_agg(format('%s -%s'::text, member_1.name, to_char(order_executor.ratio, '0.9'::text)), '\n'::text) AS order_executors
           FROM ((public.order_log order_log_1
             JOIN public.order_executor ON ((order_executor.order_id = order_log_1.id)))
             JOIN public.member member_1 ON ((member_1.id = order_executor.member_id)))
          GROUP BY order_log_1.id) o4 ON ((o4.order_log_id = order_log.id)))
     LEFT JOIN ( SELECT order_log_1.id AS order_log_id,
            string_agg(order_product.name, '\n'::text ORDER BY order_product.created_at) AS gift_plans
           FROM (public.order_log order_log_1
             JOIN public.order_product ON ((order_product.order_id = order_log_1.id)))
          WHERE ((order_product.options ->> 'type'::text) = 'gift'::text)
          GROUP BY order_log_1.id) o5 ON ((o5.order_log_id = order_log.id)))
  ORDER BY order_log.created_at DESC;
CREATE VIEW public.order_payment_status AS
 WITH order_refund AS (
         SELECT payment_log.order_id,
            sum(payment_log.price) AS refund_price
           FROM public.payment_log
          WHERE (payment_log.status = 'REFUND'::text)
          GROUP BY payment_log.order_id
        ), order_matching AS (
         SELECT payment_log.order_id
           FROM public.payment_log
          WHERE (payment_log.status = 'MATCHING'::text)
          GROUP BY payment_log.order_id
        )
 SELECT order_log.id AS order_id,
    order_log.member_id,
        CASE
            WHEN (order_matching.order_id IS NOT NULL) THEN 'MATCHING'::text
            WHEN (order_log.is_deleted = true) THEN 'DELETED'::text
            WHEN (COALESCE(order_refund.refund_price, ('-9999999'::integer)::numeric) >= (COALESCE(order_product_price.price, (0)::numeric) - COALESCE(order_discount_price.price, (0)::numeric))) THEN 'REFUND'::text
            WHEN ((COALESCE(order_payment.price, (0)::numeric) - COALESCE(order_refund.refund_price, (0)::numeric)) >= (COALESCE(order_product_price.price, (0)::numeric) - COALESCE(order_discount_price.price, (0)::numeric))) THEN 'SUCCESS'::text
            WHEN (COALESCE(order_refund.refund_price, (0)::numeric) > (0)::numeric) THEN 'PARTIAL_REFUND'::text
            WHEN ((COALESCE(order_payment.price, (0)::numeric) > (0)::numeric) AND (now() > order_log.expired_at)) THEN 'PARTIAL_EXPIRED'::text
            WHEN (COALESCE(order_payment.price, (0)::numeric) > (0)::numeric) THEN 'PARTIAL_PAID'::text
            WHEN (now() > order_log.expired_at) THEN 'EXPIRED'::text
            ELSE 'UNPAID'::text
        END AS status,
        CASE
            WHEN ((COALESCE(order_product_price.price, (0)::numeric) - COALESCE(order_discount_price.price, (0)::numeric)) <= (0)::numeric) THEN order_log.created_at
            WHEN (order_payment.order_id IS NOT NULL) THEN order_payment.paid_at
            ELSE NULL::timestamp with time zone
        END AS last_paid_at
   FROM (((((public.order_log
     LEFT JOIN order_refund ON ((order_refund.order_id = order_log.id)))
     LEFT JOIN order_matching ON ((order_matching.order_id = order_log.id)))
     LEFT JOIN ( SELECT payment_log.order_id,
            sum(payment_log.price) AS price,
            max(COALESCE(COALESCE(payment_log.paid_at, payment_log.updated_at), payment_log.created_at)) AS paid_at
           FROM public.payment_log
          WHERE (payment_log.status = 'SUCCESS'::text)
          GROUP BY payment_log.order_id) order_payment ON ((order_payment.order_id = order_log.id)))
     LEFT JOIN ( SELECT order_product.order_id,
            sum(order_product.price) AS price
           FROM public.order_product
          GROUP BY order_product.order_id) order_product_price ON ((order_product_price.order_id = order_log.id)))
     LEFT JOIN ( SELECT order_discount.order_id,
            sum(order_discount.price) AS price
           FROM public.order_discount
          GROUP BY order_discount.order_id) order_discount_price ON ((order_discount_price.order_id = order_log.id)));
CREATE VIEW public.order_product_export AS
 SELECT order_product.id AS order_product_id,
    order_product.name,
    COALESCE(((order_product.options ->> 'quantity'::text))::integer, 1) AS quantity,
    order_product.price,
    order_product.options,
    order_log.id AS order_log_id,
    member.app_id,
    COALESCE(creator.name, creator.username) AS product_owner,
    p1.paid_at,
    order_product.product_id,
    (order_log.invoice_options ->> 'referrerEmail'::text) AS referrer_email,
    order_log.created_at AS order_created_at,
    order_product.started_at AS order_product_started_at,
    order_product.ended_at AS order_product_ended_at,
    (order_log.options ->> 'country'::text) AS country,
    (order_log.options ->> 'countryCode'::text) AS country_code
   FROM (((((public.order_product
     JOIN public.order_log ON ((order_log.id = order_product.order_id)))
     JOIN public.member ON ((member.id = order_log.member_id)))
     LEFT JOIN public.product_owner ON ((product_owner.product_id = order_product.product_id)))
     LEFT JOIN public.member creator ON ((creator.id = product_owner.member_id)))
     LEFT JOIN ( SELECT DISTINCT ON (payment_log.order_id) payment_log.order_id,
            payment_log.paid_at
           FROM public.payment_log
          ORDER BY payment_log.order_id, payment_log.created_at DESC) p1 ON ((p1.order_id = order_product.order_id)))
  ORDER BY order_product.created_at DESC;
CREATE TABLE public.order_product_file (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    data jsonb,
    order_product_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.org (
    id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.package (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    title text NOT NULL,
    elements jsonb NOT NULL,
    app_id text NOT NULL
);
CREATE TABLE public.package_item (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    program_id uuid,
    activity_id uuid,
    merchandise_id uuid,
    package_item_group_id uuid NOT NULL
);
CREATE TABLE public.package_item_group (
    id uuid NOT NULL,
    title text NOT NULL,
    subtitle text NOT NULL,
    type text NOT NULL,
    package_section_id uuid NOT NULL,
    with_filter boolean NOT NULL
);
CREATE TABLE public.package_section (
    id uuid NOT NULL,
    title text NOT NULL,
    subtitle text NOT NULL,
    description text NOT NULL,
    block boolean NOT NULL,
    "position" integer NOT NULL,
    package_id uuid NOT NULL
);
CREATE VIEW public.payment_log_export AS
 SELECT payment_log.no AS payment_log_no,
    payment_log.paid_at,
    order_log.id AS order_log_id,
    order_log.status,
    order_log.invoice_options AS invoice,
    member.app_id,
    COALESCE(member.name, member.username) AS member_name,
    member.email,
    o1.order_products,
    o1.order_product_num,
    o1.order_product_total_price,
    o1.order_discount_total_price,
    order_log.shipping,
    payment_log.invoice_issued_at,
        CASE (((order_log.options -> 'country'::text) IS NULL) OR ((order_log.options ->> 'country'::text) = ''::text))
            WHEN true THEN ''::text
            ELSE format('%s(%s)'::text, (order_log.options ->> 'country'::text), (order_log.options ->> 'countryCode'::text))
        END AS country
   FROM (((public.payment_log
     JOIN public.order_log ON ((order_log.id = payment_log.order_id)))
     JOIN public.member ON ((member.id = order_log.member_id)))
     LEFT JOIN ( SELECT order_log_1.id AS order_log_id,
            string_agg(format('%s x %s'::text, order_product.name, COALESCE((order_product.options ->> 'quantity'::text), '1'::text)), '\n'::text ORDER BY order_product.created_at DESC) AS order_products,
            sum(COALESCE(((order_product.options ->> 'quantity'::text))::integer, 1)) AS order_product_num,
            sum(order_product.price) AS order_product_total_price,
            sum(order_discount.price) AS order_discount_total_price
           FROM ((public.order_log order_log_1
             LEFT JOIN public.order_product ON ((order_product.order_id = order_log_1.id)))
             LEFT JOIN public.order_discount ON ((order_discount.order_id = order_log_1.id)))
          GROUP BY order_log_1.id) o1 ON ((o1.order_log_id = order_log.id)))
  ORDER BY payment_log.created_at DESC;
CREATE TABLE public.permission (
    id text DEFAULT public.gen_random_uuid() NOT NULL,
    "group" text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.playlist (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    title text NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    member_id text NOT NULL
);
CREATE TABLE public.playlist_podcast_program (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    playlist_id uuid NOT NULL,
    podcast_program_id uuid NOT NULL,
    "position" integer NOT NULL
);
CREATE TABLE public.podcast (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    instructor_id text NOT NULL,
    app_id text NOT NULL
);
CREATE TABLE public.podcast_album (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    title text NOT NULL,
    author_id text NOT NULL,
    cover_url text,
    description text,
    is_public boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    app_id text NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    published_at timestamp with time zone,
    abstract text
);
CREATE TABLE public.podcast_album_category (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    podcast_album_id uuid NOT NULL,
    category_id text NOT NULL,
    "position" integer DEFAULT 0 NOT NULL
);
CREATE TABLE public.podcast_album_podcast_program (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    podcast_album_id uuid NOT NULL,
    podcast_program_id uuid NOT NULL,
    "position" integer DEFAULT 0 NOT NULL
);
CREATE VIEW public.podcast_plan_enrollment AS
 SELECT order_log.member_id,
    podcast_plan.id AS podcast_plan_id
   FROM ((public.order_log
     JOIN public.order_product ON (((order_product.delivered_at < now()) AND (order_product.order_id = order_log.id) AND ((order_product.ended_at IS NULL) OR (now() <= order_product.ended_at)) AND ((order_product.started_at IS NULL) OR (now() >= order_product.started_at)))))
     JOIN public.podcast_plan ON ((concat('PodcastPlan_', podcast_plan.id) = order_product.product_id)));
CREATE TABLE public.podcast_program_audio (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    podcast_program_id uuid NOT NULL,
    data jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    "position" integer NOT NULL
);
CREATE TABLE public.podcast_program_body (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    podcast_program_id uuid NOT NULL,
    description text,
    "position" integer DEFAULT 0 NOT NULL,
    data jsonb,
    deleted_at timestamp with time zone
);
CREATE TABLE public.podcast_program_category (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    category_id text NOT NULL,
    podcast_program_id uuid NOT NULL,
    "position" integer NOT NULL
);
CREATE TABLE public.podcast_program_role (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    podcast_program_id uuid NOT NULL,
    member_id text NOT NULL,
    name text NOT NULL
);
COMMENT ON COLUMN public.podcast_program_role.name IS 'instructor';
CREATE VIEW public.podcast_program_enrollment AS
 SELECT order_log.member_id,
    podcast_program.id AS podcast_program_id
   FROM ((public.order_log
     JOIN public.order_product ON (((order_product.delivered_at < now()) AND (order_product.order_id = order_log.id))))
     JOIN public.podcast_program ON ((concat('PodcastProgram_', podcast_program.id) = order_product.product_id)))
UNION
 SELECT podcast_plan_enrollment.member_id,
    podcast_program_role.podcast_program_id
   FROM (((public.podcast_plan_enrollment
     JOIN public.podcast_plan ON ((podcast_plan.id = podcast_plan_enrollment.podcast_plan_id)))
     JOIN public.member ON ((member.id = podcast_plan.creator_id)))
     JOIN public.podcast_program_role ON (((podcast_program_role.member_id = member.id) AND (podcast_program_role.name = 'instructor'::text))))
UNION
 SELECT member.id AS member_id,
    public_podcast_program.podcast_program_id
   FROM (( SELECT DISTINCT podcast_album.app_id,
            podcast_album_podcast_program.podcast_program_id
           FROM (public.podcast_album
             JOIN public.podcast_album_podcast_program ON (((podcast_album_podcast_program.podcast_album_id = podcast_album.id) AND (podcast_album.is_public = true))))) public_podcast_program
     JOIN ( SELECT member_1.app_id,
            member_1.id
           FROM public.member member_1) member ON ((member.app_id = public_podcast_program.app_id)));
CREATE TABLE public.podcast_program_progress (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    member_id text NOT NULL,
    podcast_program_id uuid NOT NULL,
    progress numeric DEFAULT 0 NOT NULL,
    last_progress numeric DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    podcast_album_id uuid
);
CREATE TABLE public.point_log (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    member_id text NOT NULL,
    description text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    point numeric NOT NULL,
    started_at timestamp with time zone,
    ended_at timestamp with time zone,
    note text
);
CREATE VIEW public.point_status AS
 SELECT member.id AS member_id,
    COALESCE((t1.points - COALESCE(t2.points, (0)::numeric)), (0)::numeric) AS points
   FROM ((public.member
     LEFT JOIN ( SELECT point_log.member_id,
            sum(point_log.point) AS points
           FROM public.point_log
          WHERE (((point_log.started_at IS NULL) OR (now() >= point_log.started_at)) AND ((point_log.ended_at IS NULL) OR (now() <= point_log.ended_at)))
          GROUP BY point_log.member_id) t1 ON ((t1.member_id = member.id)))
     LEFT JOIN ( SELECT order_log.member_id,
            sum(order_discount.price) AS points
           FROM (public.order_log
             JOIN public.order_discount ON ((order_discount.order_id = order_log.id)))
          WHERE ((order_log.status = 'SUCCESS'::text) AND (order_discount.type = 'Point'::text))
          GROUP BY order_log.member_id) t2 ON ((t2.member_id = member.id)));
CREATE TABLE public.post_category (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    post_id uuid NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    category_id text NOT NULL
);
CREATE VIEW public.post_issue AS
 SELECT issue.id AS issue_id,
    post.id AS post_id
   FROM (public.issue
     JOIN public.post ON ((issue.thread_id = concat('/posts/', (post.id)::text))));
CREATE TABLE public.post_merchandise (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    post_id uuid NOT NULL,
    merchandise_id uuid NOT NULL,
    "position" integer DEFAULT 0 NOT NULL
);
CREATE TABLE public.post_reaction (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    member_id text NOT NULL,
    post_id uuid NOT NULL
);
CREATE TABLE public.post_role (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    post_id uuid NOT NULL,
    member_id text NOT NULL,
    name text NOT NULL,
    "position" integer DEFAULT 0 NOT NULL
);
COMMENT ON COLUMN public.post_role.name IS 'creator | author';
CREATE TABLE public.practice (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    member_id text NOT NULL,
    program_content_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    title text NOT NULL,
    description text,
    cover_url text,
    reviewed_at timestamp with time zone,
    is_deleted boolean DEFAULT false NOT NULL
);
CREATE VIEW public.practice_attachment AS
 SELECT attachment.id AS attachment_id,
    (attachment.target)::uuid AS practice_id,
    attachment.app_id,
    attachment.data,
    attachment.options,
    attachment.created_at,
    attachment.updated_at
   FROM public.attachment
  WHERE ((attachment.is_deleted = false) AND (attachment.type = 'Practice'::text));
CREATE VIEW public.practice_issue AS
 SELECT issue.id AS issue_id,
    practice.id AS practice_id
   FROM (public.issue
     JOIN public.practice ON ((issue.thread_id = concat('/practices/', (practice.id)::text))));
CREATE TABLE public.practice_reaction (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    member_id text NOT NULL,
    practice_id uuid NOT NULL
);
CREATE TABLE public.product_channel (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    product_id text NOT NULL,
    channel_id uuid NOT NULL,
    app_id text NOT NULL,
    channel_sku text
);
CREATE VIEW public.product_enrollment AS
 SELECT product.id AS product_id,
    order_log.member_id,
        CASE
            WHEN (merchandise_spec.is_physical = true) THEN true
            WHEN (project_plan.is_physical = true) THEN true
            ELSE false
        END AS is_physical
   FROM ((((public.order_log
     JOIN public.order_product ON (((order_product.delivered_at < now()) AND (order_product.order_id = order_log.id) AND ((order_product.ended_at IS NULL) OR (order_product.ended_at > now())) AND ((order_product.started_at IS NULL) OR (order_product.started_at <= now())))))
     JOIN public.product ON ((product.id = order_product.product_id)))
     FULL JOIN ( SELECT concat('ProjectPlan_', project_plan_1.id) AS product_id,
            project_plan_1.is_physical
           FROM public.project_plan project_plan_1) project_plan ON ((product.id = project_plan.product_id)))
     FULL JOIN ( SELECT concat('MerchandiseSpec_', merchandise_spec_1.id) AS product_id,
            merchandise.is_physical
           FROM (public.merchandise_spec merchandise_spec_1
             JOIN public.merchandise ON ((merchandise.id = merchandise_spec_1.merchandise_id)))) merchandise_spec ON ((product.id = merchandise_spec.product_id)));
CREATE TABLE public.product_gift_plan (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    product_id text NOT NULL,
    gift_plan_id uuid,
    started_at timestamp with time zone,
    ended_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.product_gift_plan IS '產品的贈品方案';
CREATE TABLE public.program_content_plan (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    program_plan_id uuid NOT NULL,
    program_content_id uuid NOT NULL
);
CREATE VIEW public.program_enrollment AS
 SELECT program.id AS program_id,
    member.id AS member_id,
    NULL::timestamp with time zone AS updated_at,
    member.name AS member_name,
    member.email AS member_email,
    member.picture_url AS member_picture_url,
    NULL::timestamp with time zone AS product_delivered_at
   FROM ((public.program
     JOIN public.program_role ON ((program_role.program_id = program.id)))
     JOIN public.member ON ((member.id = program_role.member_id)))
  WHERE (program_role.name = 'assistant'::text)
UNION
 SELECT (product.target)::uuid AS program_id,
    order_log.member_id,
    order_log.updated_at,
    member.name AS member_name,
    member.email AS member_email,
    member.picture_url AS member_picture_url,
    order_product.delivered_at AS product_delivered_at
   FROM (((public.order_log
     JOIN public.order_product ON (((order_product.delivered_at < now()) AND (order_product.order_id = order_log.id) AND ((order_product.ended_at IS NULL) OR (order_product.ended_at > now())) AND ((order_product.started_at IS NULL) OR (order_product.started_at <= now())))))
     JOIN public.product ON (((product.id = order_product.product_id) AND (product.type = 'Program'::text))))
     JOIN public.member ON ((member.id = order_log.member_id)));
COMMENT ON VIEW public.program_enrollment IS 'members who "bought" the programs, not including the programs in the program package';
CREATE TABLE public.program_tempo_delivery (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    member_id text NOT NULL,
    program_package_program_id uuid NOT NULL,
    delivered_at timestamp with time zone NOT NULL
);
CREATE VIEW public.program_tempo_delivery_enrollment AS
 SELECT program_tempo_delivery.member_id,
    program_package_program.program_id,
    program_package_plan_enrollment.program_package_plan_id,
    program_tempo_delivery.delivered_at,
    program_package_plan_enrollment.product_delivered_at
   FROM ((((public.program_package_plan_enrollment
     JOIN public.program_package_plan ON ((program_package_plan.id = program_package_plan_enrollment.program_package_plan_id)))
     JOIN public.program_package ON ((program_package_plan.program_package_id = program_package.id)))
     JOIN public.program_package_program ON ((program_package.id = program_package_program.program_package_id)))
     JOIN public.program_tempo_delivery ON ((program_tempo_delivery.program_package_program_id = program_package_program.id)));
CREATE VIEW public.program_content_enrollment AS
 WITH program_content_info(program_id, program_content_id, app_id) AS (
         SELECT program.id AS program_id,
            program_content.id AS program_content_id,
            program.app_id
           FROM ((public.program_content
             JOIN public.program_content_section ON ((program_content_section.id = program_content.content_section_id)))
             JOIN public.program ON ((program.id = program_content_section.program_id)))
        )
 SELECT program_enrollment.program_id,
    program_content.id AS program_content_id,
    program_enrollment.member_id,
    program_enrollment.product_delivered_at
   FROM ((public.program_enrollment
     JOIN public.program_content_section ON ((program_content_section.program_id = program_enrollment.program_id)))
     JOIN public.program_content ON ((program_content_section.id = program_content.content_section_id)))
UNION
 SELECT program_plan.program_id,
    program_content_plan.program_content_id,
    program_plan_enrollment.member_id,
    program_plan_enrollment.product_delivered_at
   FROM (((public.program_plan_enrollment
     JOIN public.program_plan ON ((program_plan.id = program_plan_enrollment.program_plan_id)))
     JOIN public.program_content_plan ON ((program_plan_enrollment.program_plan_id = program_content_plan.program_plan_id)))
     JOIN public.program_content ON ((program_content.id = program_content_plan.program_content_id)))
  WHERE (((program_plan_enrollment.ended_at IS NULL) OR (program_plan_enrollment.ended_at > program_content.published_at)) AND ((program_plan_enrollment.started_at IS NULL) OR (program_plan_enrollment.started_at <= program_content.published_at)))
UNION
 SELECT program_plan.program_id,
    program_content.id AS program_content_id,
    program_plan_enrollment.member_id,
    program_plan_enrollment.product_delivered_at
   FROM (((public.program_plan_enrollment
     JOIN public.program_plan ON ((program_plan.id = program_plan_enrollment.program_plan_id)))
     JOIN public.program_content_section ON ((program_content_section.program_id = program_plan.program_id)))
     JOIN public.program_content ON ((program_content.content_section_id = program_content_section.id)))
  WHERE ((program_plan.type = 3) AND (((program_plan_enrollment.ended_at IS NULL) OR (program_plan_enrollment.ended_at > now())) AND ((program_plan_enrollment.started_at IS NULL) OR (program_plan_enrollment.started_at <= now()))))
UNION
 SELECT program_content_info.program_id,
    program_content_info.program_content_id,
    member.id AS member_id,
    NULL::timestamp with time zone AS product_delivered_at
   FROM ((program_content_info
     JOIN public.program_role ON ((program_role.program_id = program_content_info.program_id)))
     JOIN public.member ON ((member.id = program_role.member_id)))
  WHERE (program_role.name = 'instructor'::text)
UNION
 SELECT program_content_info.program_id,
    program_content_info.program_content_id,
    member.id AS member_id,
    NULL::timestamp with time zone AS product_delivered_at
   FROM (program_content_info
     JOIN public.member ON ((member.app_id = program_content_info.app_id)))
  WHERE (member.role = 'app-owner'::text)
UNION
 SELECT program_package_program.program_id,
    program_content.id AS program_content_id,
    program_package_plan_enrollment.member_id,
    program_package_plan_enrollment.product_delivered_at
   FROM (((((public.program_package_plan_enrollment
     JOIN public.program_package_plan ON ((program_package_plan.id = program_package_plan_enrollment.program_package_plan_id)))
     JOIN public.program_package ON ((program_package_plan.program_package_id = program_package.id)))
     JOIN public.program_package_program ON ((program_package.id = program_package_program.program_package_id)))
     JOIN public.program_content_section ON ((program_package_program.program_id = program_content_section.program_id)))
     JOIN public.program_content ON ((program_content.content_section_id = program_content_section.id)))
  WHERE (program_package_plan.is_tempo_delivery = false)
UNION
 SELECT program_tempo_delivery_enrollment.program_id,
    program_content.id AS program_content_id,
    program_tempo_delivery_enrollment.member_id,
    program_tempo_delivery_enrollment.product_delivered_at
   FROM ((public.program_tempo_delivery_enrollment
     JOIN public.program_content_section ON ((program_content_section.program_id = program_tempo_delivery_enrollment.program_id)))
     JOIN public.program_content ON ((program_content.content_section_id = program_content_section.id)))
  WHERE ((program_tempo_delivery_enrollment.delivered_at IS NOT NULL) OR (program_tempo_delivery_enrollment.delivered_at < now()));
COMMENT ON VIEW public.program_content_enrollment IS 'members who can "access" the program content';
CREATE VIEW public.program_access_enrollment AS
 WITH program_content_count AS (
         SELECT program.id AS program_id,
            count(DISTINCT program_content_section.id) AS program_content_section_count,
            count(program_content.id) AS program_content_count
           FROM ((public.program
             JOIN public.program_content_section ON ((program_content_section.program_id = program.id)))
             JOIN public.program_content ON ((program_content.content_section_id = program_content_section.id)))
          WHERE (program_content.published_at IS NOT NULL)
          GROUP BY program.id
        )
 SELECT program_content_enrollment.program_id,
    program_content_enrollment.member_id,
    program_content_count.program_content_section_count,
    program_content_count.program_content_count,
    (sum(program_content_progress.progress) / (count(program_content_count.*))::numeric) AS program_progress,
    max(program_content_progress.updated_at) AS last_progress_updated_at
   FROM ((public.program_content_enrollment
     JOIN public.program_content_progress ON (((program_content_progress.member_id = program_content_enrollment.member_id) AND (program_content_progress.program_content_id = program_content_enrollment.program_content_id))))
     JOIN program_content_count ON ((program_content_count.program_id = program_content_enrollment.program_id)))
  GROUP BY program_content_enrollment.program_id, program_content_enrollment.member_id, program_content_count.program_content_section_count, program_content_count.program_content_count;
COMMENT ON VIEW public.program_access_enrollment IS 'Who can access program';
CREATE TABLE public.program_announcement (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    published_at timestamp with time zone,
    program_id uuid NOT NULL
);
CREATE TABLE public.program_approval (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    program_id uuid NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    description text,
    feedback text
);
COMMENT ON COLUMN public.program_approval.status IS 'pending / canceled / rejected / approved';
CREATE VIEW public.program_approval_status AS
 SELECT t.program_id,
    t.updated_at,
    program_approval.status
   FROM (( SELECT program_approval_1.program_id,
            max(program_approval_1.updated_at) AS updated_at
           FROM public.program_approval program_approval_1
          GROUP BY program_approval_1.program_id) t
     JOIN public.program_approval ON ((t.updated_at = program_approval.updated_at)));
CREATE VIEW public.program_category_completeness AS
 SELECT program_category.category_id,
    COALESCE((sum(program_content_progress.progress) / (count(program_content_progress.id))::numeric), (0)::numeric) AS rate
   FROM (((public.program_category
     LEFT JOIN public.program_content_section ON ((program_content_section.program_id = program_category.program_id)))
     LEFT JOIN public.program_content ON ((program_content_section.id = program_content.content_section_id)))
     LEFT JOIN public.program_content_progress ON ((program_content.id = program_content_progress.program_content_id)))
  GROUP BY program_category.category_id;
CREATE VIEW public.program_content_attachment AS
 SELECT attachment.id AS attachment_id,
    (attachment.target)::uuid AS program_content_id,
    attachment.app_id,
    attachment.data,
    attachment.options,
    attachment.created_at,
    attachment.updated_at
   FROM public.attachment
  WHERE ((attachment.is_deleted = false) AND (attachment.type = 'ProgramContent'::text));
CREATE TABLE public.program_content_audio (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    program_content_id uuid NOT NULL,
    data jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.program_content_body (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    type text,
    description text,
    data jsonb,
    target uuid
);
CREATE VIEW public.program_content_exam AS
 SELECT exam.id AS exam_id,
    pc.id AS program_content_id
   FROM ((public.exam
     JOIN public.program_content_body pcb ON ((((pcb.type = 'exam'::text) OR (pcb.type = 'exercise'::text)) AND (pcb.target = exam.id))))
     JOIN public.program_content pc ON ((pc.content_body_id = pcb.id)));
CREATE TABLE public.program_content_material (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    data jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    program_content_id uuid NOT NULL
);
CREATE VIEW public.program_content_progress_enrollment AS
 SELECT program_content_progress.id,
    program_content_section.program_id,
    program_content_progress.program_content_id,
    program_content_section.id AS program_content_section_id,
    program_content_progress.member_id,
    program_content_progress.progress,
    program_content_progress.last_progress,
    program_content_progress.created_at,
    program_content_progress.updated_at
   FROM (((public.program_content_progress
     LEFT JOIN public.program_content ON ((program_content.id = program_content_progress.program_content_id)))
     LEFT JOIN public.program_content_section ON ((program_content_section.id = program_content.content_section_id)))
     LEFT JOIN public.program ON ((program.id = program_content_section.program_id)));
CREATE VIEW public.program_content_sale_free AS
 SELECT full_program_sale.program_plan_id,
    full_program_sale.program_id,
    full_program_sale.program_content_id,
        CASE
            WHEN ((full_program_sale.program_plan_sold_at <= now()) AND (full_program_sale.program_plan_sale_price = (0)::numeric)) THEN true
            ELSE false
        END AS is_sale_free_by_program_plan,
        CASE
            WHEN ((full_program_sale.program_sold_at <= now()) AND (full_program_sale.program_sale_price = (0)::numeric)) THEN true
            ELSE false
        END AS is_sale_free_by_program,
        CASE
            WHEN ((full_program_sale.program_content_sold_at <= now()) AND (full_program_sale.program_content_sale_price = (0)::numeric)) THEN true
            ELSE false
        END AS is_sale_free_by_program_content
   FROM ( SELECT program_plan.id AS program_plan_id,
            program_plan.sale_price AS program_plan_sale_price,
            program_plan.sold_at AS program_plan_sold_at,
            program.id AS program_id,
            program.sale_price AS program_sale_price,
            program.sold_at AS program_sold_at,
            program_content.id AS program_content_id,
            program_content.sale_price AS program_content_sale_price,
            program_content.sold_at AS program_content_sold_at
           FROM (public.program_plan
             FULL JOIN (public.program
             FULL JOIN (public.program_content_section
             FULL JOIN (public.program_content
             FULL JOIN public.program_content_body ON ((program_content.content_body_id = program_content_body.id))) ON ((program_content_section.id = program_content.content_section_id))) ON ((program_content_section.program_id = program.id))) ON ((program_plan.program_id = program.id)))) full_program_sale
  WHERE (((full_program_sale.program_plan_sold_at <= now()) AND (full_program_sale.program_plan_sale_price = (0)::numeric)) OR ((full_program_sale.program_sold_at <= now()) AND (full_program_sale.program_sale_price = (0)::numeric)) OR ((full_program_sale.program_content_sold_at <= now()) AND (full_program_sale.program_content_sale_price = (0)::numeric)));
CREATE VIEW public.program_content_type AS
 SELECT program_content.id,
    program_content_body.type
   FROM (public.program_content
     JOIN public.program_content_body ON ((program_content.content_body_id = program_content_body.id)));
CREATE TABLE public.program_content_video (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    program_content_id uuid NOT NULL,
    attachment_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.program_content_video IS 'stream video in each program content';
CREATE VIEW public.program_duration AS
 SELECT program_1.id AS program_id,
    sum(program_content.duration) AS duration
   FROM ((public.program program_1
     JOIN public.program_content_section ON ((program_content_section.program_id = program_1.id)))
     JOIN public.program_content ON ((program_content_section.id = program_content.content_section_id)))
  GROUP BY program_1.id;
CREATE VIEW public.program_editor AS
 SELECT program_role.program_id,
    program_role.member_id
   FROM public.program_role
  WHERE ((program_role.name = 'owner'::text) OR (program_role.name = 'instructor'::text));
CREATE SEQUENCE public.program_package_category_position_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.program_package_category_position_seq OWNED BY public.program_package_category."position";
CREATE VIEW public.program_plan_expiring_enrollment AS
 SELECT program_plan.id AS program_plan_id,
    program_plan.remind_period_amount,
    program_plan.remind_period_type,
    order_log.member_id,
    order_product.id,
    order_log.id AS order_id,
    order_product.product_id,
    order_product.name,
    order_product.options,
    order_product.started_at,
    order_product.ended_at
   FROM (((public.order_product
     JOIN public.program_plan ON (((concat('ProgramPlan_', program_plan.id) = order_product.product_id) AND (program_plan.auto_renewed IS FALSE) AND (program_plan.remind_period_amount IS NOT NULL) AND (program_plan.remind_period_type IS NOT NULL))))
     JOIN public.program ON ((program_plan.program_id = program.id)))
     JOIN public.order_log ON (((order_log.id = order_product.order_id) AND (order_product.delivered_at < now()))))
  WHERE ((order_product.ended_at > now()) AND ((order_product.options ->> 'remindedAt'::text) IS NULL) AND ((order_product.ended_at - (concat((program_plan.remind_period_amount)::text, ' ',
        CASE
            WHEN (program_plan.remind_period_type = 'D'::text) THEN 'days'::text
            WHEN (program_plan.remind_period_type = 'W'::text) THEN 'weeks'::text
            WHEN (program_plan.remind_period_type = 'M'::text) THEN 'months'::text
            WHEN (program_plan.remind_period_type = 'Y'::text) THEN 'years'::text
            ELSE 'days'::text
        END))::interval) < now()));
CREATE TABLE public.program_related_item (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    program_id uuid NOT NULL,
    class text NOT NULL,
    target jsonb NOT NULL,
    weight numeric NOT NULL
);
CREATE TABLE public.review (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    path text NOT NULL,
    member_id text NOT NULL,
    score numeric NOT NULL,
    title text NOT NULL,
    content text,
    private_content text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    app_id text NOT NULL
);
COMMENT ON COLUMN public.review.path IS '/programs/:programId';
CREATE VIEW public.program_review_score AS
 SELECT program.id AS program_id,
    program_review_avg_score.avg_score AS score
   FROM (public.program
     LEFT JOIN ( SELECT split_part(review.path, '/'::text, 3) AS program_id,
            avg(review.score) AS avg_score
           FROM public.review
          WHERE (review.path ~~ '/programs/%'::text)
          GROUP BY review.path) program_review_avg_score ON ((program_review_avg_score.program_id = (program.id)::text)));
CREATE MATERIALIZED VIEW public.program_statistics AS
 WITH program_plan_enrolled AS (
         SELECT (program_plan.program_id)::text AS program_id,
            count(DISTINCT order_log.member_id) AS count
           FROM ((( SELECT order_product.order_id,
                    order_product.product_id
                   FROM public.order_product
                  WHERE ((order_product.delivered_at IS NOT NULL) AND (order_product.product_id ~~ 'ProgramPlan_%'::text))) order_program_plan
             JOIN public.order_log ON ((order_log.id = order_program_plan.order_id)))
             JOIN public.program_plan ON (((program_plan.id)::text = split_part(order_program_plan.product_id, '_'::text, 2))))
          GROUP BY program_plan.program_id
        ), program_package_plan_enrolled AS (
         SELECT (program_package_program.program_id)::text AS program_id,
            count(DISTINCT order_log.member_id) AS count
           FROM (((( SELECT order_product.order_id,
                    order_product.product_id
                   FROM public.order_product
                  WHERE ((order_product.delivered_at IS NOT NULL) AND (order_product.product_id ~~ 'ProgramPackagePlan_%'::text))) order_program_package_plan
             JOIN public.order_log ON ((order_log.id = order_program_package_plan.order_id)))
             JOIN public.program_package_plan ON (((program_package_plan.id)::text = split_part(order_program_package_plan.product_id, '_'::text, 2))))
             JOIN public.program_package_program ON ((program_package_program.program_package_id = program_package_plan.program_package_id)))
          GROUP BY program_package_program.program_id
        )
 SELECT program.app_id,
    program.id AS program_id,
    COALESCE(program_plan_enrolled.count, (0)::bigint) AS program_plan_enrolled_count,
    COALESCE(program_package_plan_enrolled.count, (0)::bigint) AS program_package_plan_enrolled_count
   FROM ((public.program
     LEFT JOIN program_plan_enrolled ON ((program_plan_enrolled.program_id = (program.id)::text)))
     LEFT JOIN program_package_plan_enrolled ON ((program_package_plan_enrolled.program_id = (program.id)::text)))
  WITH NO DATA;
CREATE TABLE public.program_timetable (
    member_id text NOT NULL,
    program_id uuid NOT NULL,
    "time" timestamp with time zone NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT public.gen_random_uuid() NOT NULL
);
CREATE VIEW public.project_plan_enrollment AS
 SELECT (product.target)::uuid AS project_plan_id,
    order_log.member_id,
    order_product.started_at,
    order_product.ended_at
   FROM ((public.order_log
     JOIN public.order_product ON (((order_product.delivered_at < now()) AND (order_product.order_id = order_log.id) AND ((order_product.ended_at IS NULL) OR (order_product.ended_at > now())) AND ((order_product.started_at IS NULL) OR (order_product.started_at <= now())))))
     JOIN public.product ON (((product.id = order_product.product_id) AND (product.type = 'ProjectPlan'::text))));
CREATE VIEW public.project_plan_inventory_status AS
 SELECT project_plan.project_plan_id,
    product_inventory_status.total_quantity,
    product_inventory_status.undelivered_quantity,
    product_inventory_status.delivered_quantity,
    product_inventory_status.buyable_quantity
   FROM (public.product_inventory_status
     JOIN ( SELECT concat('ProjectPlan_', project_plan_1.id) AS product_id,
            project_plan_1.id AS project_plan_id,
            project_plan_1.is_limited
           FROM public.project_plan project_plan_1) project_plan ON ((product_inventory_status.product_id = project_plan.product_id)))
  WHERE (project_plan.is_limited = true);
CREATE TABLE public.project_reaction (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    member_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    project_id uuid NOT NULL
);
CREATE TABLE public.project_role (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    member_id text NOT NULL,
    identity_id uuid NOT NULL,
    rejected_reason text,
    rejected_at timestamp with time zone,
    has_sended_marked_notification boolean DEFAULT false NOT NULL,
    agreed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    marked_notification_status text DEFAULT 'unsend'::text NOT NULL,
    CONSTRAINT marked_notification_status_check CHECK (((marked_notification_status = 'unsend'::text) OR (marked_notification_status = 'readyToSend'::text) OR (marked_notification_status = 'sended'::text)))
);
COMMENT ON COLUMN public.project_role.marked_notification_status IS 'unsend, readyToSend, sended';
CREATE VIEW public.project_sales AS
 SELECT t.project_id,
    sum(t.price) AS total_sales
   FROM ( SELECT project_plan.project_id,
            order_product.price
           FROM ((public.order_product
             LEFT JOIN public.product ON (((product.id = order_product.product_id) AND (order_product.delivered_at < now()))))
             LEFT JOIN public.project_plan ON ((((project_plan.id)::text = product.target) AND (project_plan.project_id IS NOT NULL))))) t
  GROUP BY t.project_id;
CREATE TABLE public.project_section (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    type text NOT NULL,
    options jsonb,
    "position" integer
);
COMMENT ON COLUMN public.project_section.options IS 'messenger: https://github.com/Yoctol/react-messenger-customer-chat#props';
CREATE TABLE public.property (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    app_id text NOT NULL,
    type text NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    placeholder text,
    is_editable boolean DEFAULT false NOT NULL,
    is_business boolean DEFAULT false NOT NULL,
    is_required boolean DEFAULT false NOT NULL
);
CREATE TABLE public.question (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    question_group_id uuid NOT NULL,
    type text DEFAULT 'single'::text NOT NULL,
    subject text NOT NULL,
    layout text NOT NULL,
    font text NOT NULL,
    "position" integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    explanation text
);
COMMENT ON TABLE public.question IS '題目';
CREATE TABLE public.question_group (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    question_library_id uuid NOT NULL,
    title text NOT NULL,
    modifier_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);
COMMENT ON TABLE public.question_group IS '題組';
CREATE TABLE public.question_library (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    app_id text NOT NULL,
    title text NOT NULL,
    abstract text,
    modifier_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);
COMMENT ON TABLE public.question_library IS '題庫';
CREATE TABLE public.question_option (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    question_id uuid NOT NULL,
    value text NOT NULL,
    is_answer boolean,
    "position" integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);
COMMENT ON TABLE public.question_option IS '題目選項';
CREATE MATERIALIZED VIEW public.resource AS
 WITH program_owners AS (
         SELECT program_role.program_id,
            member.name,
            member.id AS member_id
           FROM (public.program_role
             JOIN public.member ON (((member.id = program_role.member_id) AND (program_role.name = 'instructor'::text))))
        ), program_r AS (
         SELECT concat(program.app_id, ':program:', program.id) AS meta_urn,
            concat(program.app_id, ':program:', program.id) AS urn,
            program.id,
            program.title,
            pc.categories,
            pt.tags,
            pv.variants,
            pv.owners,
            program.app_id
           FROM (((public.program
             LEFT JOIN ( SELECT program_category.program_id,
                    (json_agg(category.name))::jsonb AS categories
                   FROM (public.program_category
                     JOIN public.category ON ((category.id = program_category.category_id)))
                  GROUP BY program_category.program_id) pc ON ((pc.program_id = program.id)))
             LEFT JOIN ( SELECT program_tag.program_id,
                    jsonb_agg(program_tag.tag_name) AS tags
                   FROM public.program_tag
                  GROUP BY program_tag.program_id) pt ON ((pt.program_id = program.id)))
             LEFT JOIN ( SELECT program_owners.program_id,
                    (json_agg(program_owners.name))::jsonb AS variants,
                    (json_agg(json_build_object('name', program_owners.name, 'id', program_owners.member_id)))::jsonb AS owners
                   FROM program_owners
                  GROUP BY program_owners.program_id) pv ON ((pv.program_id = program.id)))
          WHERE ((program.published_at IS NOT NULL) AND (program.is_deleted IS FALSE))
        ), activity_r AS (
         SELECT concat(activity.app_id, ':activity:', activity.id) AS meta_urn,
            concat(activity.app_id, ':activity:', activity.id) AS urn,
            activity.id,
            activity.title,
            ac.categories,
            ata.tags,
            av.variants,
            av.owners,
            activity.app_id
           FROM (((public.activity
             LEFT JOIN ( SELECT activity_category.activity_id,
                    (json_agg(category.name))::jsonb AS categories
                   FROM (public.activity_category
                     JOIN public.category ON ((category.id = activity_category.category_id)))
                  GROUP BY activity_category.activity_id) ac ON ((ac.activity_id = activity.id)))
             LEFT JOIN ( SELECT activity_1.id AS activity_id,
                    (json_agg(member.name))::jsonb AS variants,
                    (json_agg(json_build_object('name', member.name, 'id', member.id)))::jsonb AS owners
                   FROM (public.activity activity_1
                     JOIN public.member ON ((member.id = activity_1.organizer_id)))
                  GROUP BY activity_1.id) av ON ((av.activity_id = activity.id)))
             LEFT JOIN ( SELECT activity_tag.activity_id,
                    jsonb_agg(activity_tag.tag_name) AS tags
                   FROM public.activity_tag
                  GROUP BY activity_tag.activity_id) ata ON ((ata.activity_id = activity.id)))
          WHERE ((activity.published_at IS NOT NULL) AND (activity.deleted_at IS NULL))
        ), program_package_r AS (
         SELECT concat(program_package.app_id, ':program_package:', program_package.id) AS meta_urn,
            concat(program_package.app_id, ':program_package:', program_package.id) AS urn,
            program_package.id,
            program_package.title,
            pc.categories,
            pt.tags,
            pv.variants,
            pv.owners,
            program_package.app_id
           FROM (((public.program_package
             LEFT JOIN ( SELECT program_package_category.program_package_id,
                    (json_agg(category.name))::jsonb AS categories
                   FROM (public.program_package_category
                     JOIN public.category ON ((category.id = program_package_category.category_id)))
                  GROUP BY program_package_category.program_package_id) pc ON ((pc.program_package_id = program_package.id)))
             LEFT JOIN ( SELECT program_package_tag.program_package_id,
                    jsonb_agg(program_package_tag.tag_name) AS tags
                   FROM public.program_package_tag
                  GROUP BY program_package_tag.program_package_id) pt ON ((pt.program_package_id = program_package.id)))
             LEFT JOIN ( SELECT program_package_program.program_package_id,
                    jsonb_agg(DISTINCT program.title) AS variants,
                    (json_agg(json_build_object('id', program_owners.member_id, 'name', program_owners.name)))::jsonb AS owners
                   FROM ((public.program_package_program
                     JOIN program_owners ON ((program_owners.program_id = program_package_program.program_id)))
                     JOIN public.program ON ((program_package_program.program_id = program.id)))
                  GROUP BY program_package_program.program_package_id) pv ON ((pv.program_package_id = program_package.id)))
          WHERE (program_package.published_at IS NOT NULL)
        ), program_plan_r AS (
         SELECT concat('program_plan:', program_plan.id) AS partial_urn,
            program_plan.program_id AS meta_id,
            program_plan.title,
                CASE
                    WHEN (((program_plan.sale_price IS NOT NULL) AND (program_plan.sold_at IS NULL)) OR (now() < program_plan.sold_at)) THEN program_plan.sale_price
                    ELSE program_plan.list_price
                END AS price,
            row_number() OVER (PARTITION BY program_plan.program_id ORDER BY program_plan.created_at DESC) AS "position",
            product.sku
           FROM (public.program_plan
             LEFT JOIN public.product ON ((product.id = concat('ProgramPlan_', program_plan.id))))
          WHERE ((program_plan.published_at IS NOT NULL) AND (program_plan.is_deleted IS FALSE))
        ), activity_ticket_r AS (
         SELECT concat('activity_ticket:', activity_ticket.id) AS partial_urn,
            activity_ticket.activity_id AS meta_id,
            activity_ticket.title,
            activity_ticket.price,
            row_number() OVER (PARTITION BY activity_ticket.activity_id ORDER BY activity_ticket.ended_at DESC) AS "position",
            product.sku
           FROM (public.activity_ticket
             LEFT JOIN public.product ON ((product.id = concat('ActivityTicket_', activity_ticket.id))))
          WHERE ((activity_ticket.is_published IS TRUE) AND (activity_ticket.deleted_at IS NULL))
        ), program_package_plan_r AS (
         SELECT concat('program_package_plan:', program_package_plan.id) AS partial_urn,
            program_package_plan.program_package_id AS meta_id,
            program_package_plan.title,
                CASE
                    WHEN (((program_package_plan.sale_price IS NOT NULL) AND (program_package_plan.sold_at IS NULL)) OR (now() < program_package_plan.sold_at)) THEN program_package_plan.sale_price
                    ELSE program_package_plan.list_price
                END AS price,
            row_number() OVER (PARTITION BY program_package_plan.program_package_id ORDER BY program_package_plan."position") AS "position",
            product.sku
           FROM (public.program_package_plan
             LEFT JOIN public.product ON ((product.id = concat('ProgramPackagePlan_', program_package_plan.id))))
          WHERE (program_package_plan.published_at < now())
        ), program_content_r AS (
         SELECT concat('program_content:', program_content.id) AS partial_urn,
            program_content_section.program_id AS meta_id,
            concat(program_content_section.title, ' - ', program_content.title) AS title,
                CASE
                    WHEN (((program_content.sale_price IS NOT NULL) AND (program_content.sold_at IS NULL)) OR (now() < program_content.sold_at)) THEN program_content.sale_price
                    ELSE program_content.list_price
                END AS price,
            row_number() OVER (PARTITION BY program_content_section.program_id ORDER BY program_content_section."position", program_content."position") AS "position"
           FROM (public.program_content
             JOIN public.program_content_section ON ((program_content.content_section_id = program_content_section.id)))
        ), post_r AS (
         SELECT concat(p.app_id, ':post:', p.id) AS id,
            p.title AS name,
            NULL::numeric AS price,
            pc.categories,
            pt.tags,
            pr.variants,
            pr.owners,
            NULL::text AS sku,
            p.app_id,
            concat(p.app_id, ':post:', p.id) AS meta_id
           FROM (((public.post p
             LEFT JOIN ( SELECT post_category.post_id,
                    jsonb_agg(category.name) AS categories
                   FROM (public.post_category
                     JOIN public.category ON ((post_category.category_id = category.id)))
                  GROUP BY post_category.post_id) pc ON ((p.id = pc.post_id)))
             LEFT JOIN ( SELECT post_role.post_id,
                    jsonb_agg(json_build_object('name', member.name, 'id', member.id)) AS owners,
                    jsonb_agg(member.name) AS variants
                   FROM (public.post_role
                     JOIN public.member ON (((post_role.member_id = member.id) AND (post_role.name = 'author'::text))))
                  GROUP BY post_role.post_id) pr ON ((pr.post_id = p.id)))
             LEFT JOIN ( SELECT post_tag.post_id,
                    jsonb_agg(post_tag.tag_name) AS tags
                   FROM public.post_tag
                  GROUP BY post_tag.post_id) pt ON ((p.id = pt.post_id)))
        ), project_r AS (
         SELECT concat(project.app_id, ':project:', project.id) AS meta_urn,
            concat(project.app_id, ':project:', project.id) AS urn,
            project.id,
            project.title,
            pc.categories,
            pt.tags,
            pv.variants,
            pv.owners,
            project.app_id
           FROM (((public.project
             LEFT JOIN ( SELECT project_category.project_id,
                    (json_agg(category.name))::jsonb AS categories
                   FROM (public.project_category
                     JOIN public.category ON ((category.id = project_category.category_id)))
                  GROUP BY project_category.project_id) pc ON ((pc.project_id = project.id)))
             LEFT JOIN ( SELECT project_tag.project_id,
                    jsonb_agg(project_tag.tag_name) AS tags
                   FROM public.project_tag
                  GROUP BY project_tag.project_id) pt ON ((pt.project_id = project.id)))
             LEFT JOIN ( SELECT member.id,
                    jsonb_agg(member.name) AS variants,
                    jsonb_agg(json_build_object('name', member.name, 'id', member.id)) AS owners
                   FROM public.member
                  GROUP BY member.id) pv ON ((pv.id = project.creator_id)))
          WHERE (project.published_at IS NOT NULL)
        ), project_plan_r AS (
         SELECT concat('project_plan:', project_plan.id) AS partial_urn,
            project_plan.project_id AS meta_id,
            project_plan.title,
                CASE
                    WHEN (((project_plan.sale_price IS NOT NULL) AND (project_plan.sold_at IS NULL)) OR (now() < project_plan.sold_at)) THEN project_plan.sale_price
                    ELSE project_plan.list_price
                END AS price,
            row_number() OVER (PARTITION BY project_plan.project_id ORDER BY project_plan.created_at DESC) AS "position",
            product.sku
           FROM (public.project_plan
             LEFT JOIN public.product ON (((project_plan.id)::text = product.target)))
        ), podcast_album_r AS (
         SELECT concat(pa.app_id, ':podcast_album:', pa.id) AS id,
            pa.title,
            0 AS price,
            pac.categories,
            NULL::jsonb AS tags,
            pm.variants,
            pm.owners,
            product.sku,
            pa.app_id,
            concat(pa.app_id, ':podcast_album:', pa.id) AS meta_id
           FROM (((( SELECT podcast_album.id,
                    podcast_album.title,
                    podcast_album.author_id,
                    podcast_album.cover_url,
                    podcast_album.description,
                    podcast_album.is_public,
                    podcast_album.created_at,
                    podcast_album.updated_at,
                    podcast_album.app_id,
                    podcast_album.is_deleted,
                    podcast_album.published_at,
                    podcast_album.abstract
                   FROM public.podcast_album
                  WHERE ((podcast_album.published_at IS NOT NULL) OR ((now() < podcast_album.published_at) AND (podcast_album.is_deleted IS FALSE)))) pa
             LEFT JOIN ( SELECT podcast_album_category.podcast_album_id,
                    (json_agg(category.name))::jsonb AS categories
                   FROM (public.podcast_album_category
                     JOIN public.category ON ((category.id = podcast_album_category.category_id)))
                  GROUP BY podcast_album_category.podcast_album_id) pac ON ((pa.id = pac.podcast_album_id)))
             LEFT JOIN ( SELECT podcast_album.id,
                    jsonb_agg(member.name) AS variants,
                    (json_agg(json_build_object('id', member.id, 'name', member.name)))::jsonb AS owners
                   FROM (public.podcast_album
                     JOIN public.member ON ((member.id = podcast_album.author_id)))
                  GROUP BY podcast_album.id) pm ON ((pm.id = pa.id)))
             LEFT JOIN public.product ON ((product.id = concat('PodcastAlbum_', pa.id))))
        ), podcast_program_r AS (
         SELECT concat(ppr.app_id, ':podcast_program:', pp.id) AS id,
            pp.title,
            pp.price,
            ppc.categories,
            ppt.tags,
            ppr.variants,
            ppr.owners,
            product.sku,
            ppr.app_id,
            concat(ppr.app_id, ':podcast_program:', pp.id) AS meta_id
           FROM ((((( SELECT podcast_program.id,
                    podcast_program.title,
                        CASE
                            WHEN (((podcast_program.sale_price IS NOT NULL) AND (podcast_program.sold_at IS NULL)) OR (now() < podcast_program.sold_at)) THEN podcast_program.sale_price
                            ELSE podcast_program.list_price
                        END AS price
                   FROM public.podcast_program
                  WHERE ((podcast_program.published_at IS NOT NULL) OR (now() < podcast_program.published_at))) pp
             LEFT JOIN ( SELECT podcast_program_category.podcast_program_id AS id,
                    (json_agg(category.name))::jsonb AS categories
                   FROM (public.podcast_program_category
                     JOIN public.category ON ((category.id = podcast_program_category.category_id)))
                  GROUP BY podcast_program_category.podcast_program_id) ppc ON ((pp.id = ppc.id)))
             LEFT JOIN ( SELECT member.app_id,
                    podcast_program_role_1.podcast_program_id AS id,
                    jsonb_agg(member.name) AS variants,
                    (json_agg(json_build_object('id', member.id, 'name', member.name)))::jsonb AS owners
                   FROM (( SELECT podcast_program_role.id,
                            podcast_program_role.podcast_program_id,
                            podcast_program_role.member_id,
                            podcast_program_role.name
                           FROM public.podcast_program_role
                          WHERE (podcast_program_role.name = 'instructor'::text)) podcast_program_role_1
                     JOIN public.member ON ((member.id = podcast_program_role_1.member_id)))
                  GROUP BY podcast_program_role_1.podcast_program_id, member.app_id) ppr ON ((pp.id = ppr.id)))
             LEFT JOIN ( SELECT podcast_program_tag.podcast_program_id AS id,
                    jsonb_agg(podcast_program_tag.tag_name) AS tags
                   FROM public.podcast_program_tag
                  GROUP BY podcast_program_tag.podcast_program_id) ppt ON ((pp.id = ppt.id)))
             LEFT JOIN public.product ON ((product.id = concat('PodcastProgram_', pp.id))))
        ), merchandise_spec_r AS (
         SELECT concat('merchandise_spec:', merchandise_spec.id) AS partial_urn,
            merchandise_spec.merchandise_id AS meta_id,
            merchandise_spec.title,
                CASE
                    WHEN (((merchandise_spec.sale_price IS NOT NULL) AND (merchandise.sold_at IS NULL)) OR (now() < merchandise.sold_at)) THEN merchandise_spec.sale_price
                    ELSE merchandise_spec.list_price
                END AS price,
            product.sku,
            row_number() OVER (PARTITION BY merchandise_spec.merchandise_id ORDER BY merchandise_spec.created_at DESC) AS "position"
           FROM ((public.merchandise_spec
             LEFT JOIN public.product ON ((product.id = concat('MerchandiseSpec_', merchandise_spec.id))))
             LEFT JOIN public.merchandise ON ((merchandise_spec.merchandise_id = merchandise.id)))
          WHERE ((merchandise.published_at IS NOT NULL) AND (merchandise_spec.is_deleted IS FALSE))
        ), merchandise_r AS (
         SELECT concat(merchandise.app_id, ':merchandise:', merchandise.id) AS meta_urn,
            concat(merchandise.app_id, ':merchandise:', merchandise.id) AS urn,
            merchandise.id,
            merchandise.title,
            mc.categories,
            mta.tags,
            mv.owners,
            merchandise.app_id
           FROM (((public.merchandise
             LEFT JOIN ( SELECT merchandise_category.merchandise_id,
                    (json_agg(category.name))::jsonb AS categories
                   FROM (public.merchandise_category
                     JOIN public.category ON ((category.id = merchandise_category.category_id)))
                  GROUP BY merchandise_category.merchandise_id) mc ON ((mc.merchandise_id = merchandise.id)))
             LEFT JOIN ( SELECT merchandise_1.id AS merchandise_id,
                    (json_agg(json_build_object('name', member.name, 'id', member.id)))::jsonb AS owners
                   FROM (public.merchandise merchandise_1
                     JOIN public.member ON ((member.id = merchandise_1.member_id)))
                  GROUP BY merchandise_1.id) mv ON ((mv.merchandise_id = merchandise.id)))
             LEFT JOIN ( SELECT merchandise_tag.merchandise_id,
                    jsonb_agg(merchandise_tag.tag_name) AS tags
                   FROM public.merchandise_tag
                  GROUP BY merchandise_tag.merchandise_id) mta ON ((mta.merchandise_id = merchandise.id)))
          WHERE ((merchandise.published_at IS NOT NULL) AND (merchandise.is_deleted IS FALSE))
        ), appointment_plan_r AS (
         SELECT concat(member_public.app_id, ':appointment_plan:', appointment_plan.id) AS meta_urn,
            concat(member_public.app_id, ':appointment_plan:', appointment_plan.id) AS urn,
            appointment_plan.title,
            apc.categories,
                CASE
                    WHEN (member_public.tag_names = '[]'::jsonb) THEN NULL::jsonb
                    ELSE member_public.tag_names
                END AS tags,
            jsonb_agg(member_public.name) OVER (PARTITION BY appointment_plan.id) AS variants,
            (json_agg(json_build_object('name', member_public.name, 'id', member_public.id)) OVER (PARTITION BY appointment_plan.id))::jsonb AS owners,
            appointment_plan.price,
            product.sku,
            member_public.app_id
           FROM (((public.appointment_plan
             LEFT JOIN public.product ON ((product.id = concat('AppointmentPlan_', appointment_plan.id))))
             LEFT JOIN public.member_public ON ((member_public.id = appointment_plan.creator_id)))
             LEFT JOIN ( SELECT creator_category.creator_id,
                    (json_agg(category.name))::jsonb AS categories
                   FROM (public.creator_category
                     JOIN public.category ON ((category.id = creator_category.category_id)))
                  GROUP BY creator_category.creator_id) apc ON ((apc.creator_id = member_public.id)))
          WHERE (appointment_plan.published_at IS NOT NULL)
        ), voucher_plan_r AS (
         SELECT concat(voucher_plan.app_id, ':voucher_plan:', voucher_plan.id) AS meta_urn,
            concat(voucher_plan.app_id, ':voucher_plan:', voucher_plan.id) AS urn,
            voucher_plan.id,
            voucher_plan.title,
            voucher_plan.sale_price,
            voucher_plan.app_id
           FROM public.voucher_plan
        )
 SELECT concat(pr.app_id, ':', program_content_r.partial_urn) AS id,
    program_content_r.title AS name,
    program_content_r.price,
    pr.categories,
    pr.tags,
    jsonb_agg(pr.title) OVER (PARTITION BY program_content_r.partial_urn) AS variants,
    pr.owners,
    pr.sku,
    pr.app_id,
    pr.meta_urn AS meta_id
   FROM (program_content_r
     JOIN ( SELECT DISTINCT ON (program_r.urn) program_r.meta_urn,
            program_r.urn,
            program_r.id,
            program_r.title,
            program_r.categories,
            program_r.tags,
            program_r.variants,
            program_r.owners,
            program_r.app_id,
            string_agg(program_plan_r.sku, '|'::text) OVER (PARTITION BY program_r.id) AS sku
           FROM (program_r
             JOIN program_plan_r ON ((program_r.id = program_plan_r.meta_id)))) pr ON ((pr.id = program_content_r.meta_id)))
UNION
 SELECT concat(ppr.app_id, ':', pppr.partial_urn) AS id,
    concat(ppr.title, '|', pppr.title) AS name,
    pppr.price,
    ppr.categories,
    ppr.tags,
    ppr.variants,
    ppr.owners,
    pppr.sku,
    ppr.app_id,
    ppr.meta_urn AS meta_id
   FROM (program_package_plan_r pppr
     JOIN program_package_r ppr ON ((ppr.id = pppr.meta_id)))
UNION
 SELECT DISTINCT ON (ppr.urn) ppr.urn AS id,
    ppr.title AS name,
    first_value(pppr.price) OVER (PARTITION BY ppr.id) AS price,
    ppr.categories,
    ppr.tags,
    ppr.variants,
    ppr.owners,
    string_agg(pppr.sku, '|'::text) OVER (PARTITION BY ppr.id) AS sku,
    ppr.app_id,
    ppr.meta_urn AS meta_id
   FROM (program_package_r ppr
     JOIN program_package_plan_r pppr ON ((ppr.id = pppr.meta_id)))
UNION
 SELECT concat(activity_r.app_id, ':', activity_ticket_r.partial_urn) AS id,
    concat(activity_r.title, '|', activity_ticket_r.title) AS name,
    activity_ticket_r.price,
    activity_r.categories,
    activity_r.tags,
    activity_r.variants,
    activity_r.owners,
    activity_ticket_r.sku,
    activity_r.app_id,
    activity_r.meta_urn AS meta_id
   FROM (activity_ticket_r
     JOIN activity_r ON ((activity_ticket_r.meta_id = activity_r.id)))
UNION
 SELECT DISTINCT ON (activity_r.urn) activity_r.urn AS id,
    activity_r.title AS name,
    first_value(activity_ticket_r.price) OVER (PARTITION BY activity_r.id) AS price,
    activity_r.categories,
    activity_r.tags,
    activity_r.variants,
    activity_r.owners,
    string_agg(activity_ticket_r.sku, '|'::text) OVER (PARTITION BY activity_r.id) AS sku,
    activity_r.app_id,
    activity_r.meta_urn AS meta_id
   FROM (activity_r
     JOIN activity_ticket_r ON ((activity_r.id = activity_ticket_r.meta_id)))
UNION
 SELECT concat(program_r.app_id, ':', program_plan_r.partial_urn) AS id,
    concat(program_r.title, '|', program_plan_r.title) AS name,
    program_plan_r.price,
    program_r.categories,
    program_r.tags,
    program_r.variants,
    program_r.owners,
    program_plan_r.sku,
    program_r.app_id,
    program_r.meta_urn AS meta_id
   FROM (program_plan_r
     JOIN program_r ON ((program_plan_r.meta_id = program_r.id)))
UNION
 SELECT DISTINCT ON (program_r.urn) program_r.urn AS id,
    program_r.title AS name,
    first_value(program_plan_r.price) OVER (PARTITION BY program_r.id) AS price,
    program_r.categories,
    program_r.tags,
    program_r.variants,
    program_r.owners,
    string_agg(program_plan_r.sku, '|'::text) OVER (PARTITION BY program_r.id) AS sku,
    program_r.app_id,
    program_r.meta_urn AS meta_id
   FROM (program_r
     JOIN program_plan_r ON ((program_r.id = program_plan_r.meta_id)))
UNION
 SELECT post_r.id,
    post_r.name,
    post_r.price,
    post_r.categories,
    post_r.tags,
    post_r.variants,
    post_r.owners,
    post_r.sku,
    post_r.app_id,
    post_r.meta_id
   FROM post_r
UNION
 SELECT concat(pjr.app_id, ':', pjpr.partial_urn) AS id,
    concat(pjr.title, '|', pjpr.title) AS name,
    pjpr.price,
    pjr.categories,
    pjr.tags,
    pjr.variants,
    pjr.owners,
    pjpr.sku,
    pjr.app_id,
    pjr.meta_urn AS meta_id
   FROM (project_plan_r pjpr
     JOIN project_r pjr ON ((pjpr.meta_id = pjr.id)))
UNION
 SELECT DISTINCT ON (project_r.urn) project_r.urn AS id,
    project_r.title AS name,
    first_value(project_plan_r.price) OVER (PARTITION BY project_r.id ORDER BY project_plan_r."position") AS price,
    project_r.categories,
    project_r.tags,
    project_r.variants,
    project_r.owners,
    string_agg(project_plan_r.sku, '|'::text) OVER (PARTITION BY project_r.id ORDER BY project_plan_r."position") AS sku,
    project_r.app_id,
    project_r.meta_urn AS meta_id
   FROM (project_r
     JOIN project_plan_r ON ((project_r.id = project_plan_r.meta_id)))
UNION
 SELECT podcast_album_r.id,
    podcast_album_r.title AS name,
    podcast_album_r.price,
    podcast_album_r.categories,
    podcast_album_r.tags,
    podcast_album_r.variants,
    podcast_album_r.owners,
    podcast_album_r.sku,
    podcast_album_r.app_id,
    podcast_album_r.meta_id
   FROM podcast_album_r
UNION
 SELECT podcast_program_r.id,
    podcast_program_r.title AS name,
    podcast_program_r.price,
    podcast_program_r.categories,
    podcast_program_r.tags,
    podcast_program_r.variants,
    podcast_program_r.owners,
    podcast_program_r.sku,
    podcast_program_r.app_id,
    podcast_program_r.meta_id
   FROM podcast_program_r
UNION
 SELECT concat(merchandise_r.app_id, ':', merchandise_spec_r.partial_urn) AS id,
    concat(merchandise_r.title, '|', merchandise_spec_r.title) AS name,
    merchandise_spec_r.price,
    merchandise_r.categories,
    merchandise_r.tags,
    NULL::jsonb AS variants,
    merchandise_r.owners,
    merchandise_spec_r.sku,
    merchandise_r.app_id,
    merchandise_r.meta_urn AS meta_id
   FROM (merchandise_spec_r
     JOIN merchandise_r ON ((merchandise_spec_r.meta_id = merchandise_r.id)))
UNION
 SELECT DISTINCT ON (merchandise_r.urn) merchandise_r.urn AS id,
    merchandise_r.title AS name,
    first_value(merchandise_spec_r.price) OVER (PARTITION BY merchandise_r.id ORDER BY merchandise_spec_r."position") AS price,
    merchandise_r.categories,
    merchandise_r.tags,
    jsonb_agg(merchandise_spec_r.title) OVER (PARTITION BY merchandise_spec_r.partial_urn) AS variants,
    merchandise_r.owners,
    string_agg(merchandise_spec_r.sku, '|'::text) OVER (PARTITION BY merchandise_r.id ORDER BY merchandise_spec_r."position") AS sku,
    merchandise_r.app_id,
    merchandise_r.meta_urn AS meta_id
   FROM (merchandise_r
     JOIN merchandise_spec_r ON ((merchandise_r.id = merchandise_spec_r.meta_id)))
UNION
 SELECT DISTINCT ON (appointment_plan_r.urn) appointment_plan_r.urn AS id,
    appointment_plan_r.title AS name,
    appointment_plan_r.price,
    appointment_plan_r.categories,
    appointment_plan_r.tags,
    appointment_plan_r.variants,
    appointment_plan_r.owners,
    appointment_plan_r.sku,
    appointment_plan_r.app_id,
    appointment_plan_r.meta_urn AS meta_id
   FROM appointment_plan_r
UNION
 SELECT DISTINCT ON (voucher_plan_r.urn) voucher_plan_r.urn AS id,
    voucher_plan_r.title AS name,
    voucher_plan_r.sale_price AS price,
    NULL::jsonb AS categories,
    NULL::jsonb AS tags,
    NULL::jsonb AS variants,
    NULL::jsonb AS owners,
    NULL::text AS sku,
    voucher_plan_r.app_id,
    voucher_plan_r.meta_urn AS meta_id
   FROM voucher_plan_r
  WITH NO DATA;
CREATE VIEW public.resource_1 AS
 WITH program_owners AS (
         SELECT program_role.program_id,
            member.name,
            member.id AS member_id
           FROM (public.program_role
             JOIN public.member ON (((member.id = program_role.member_id) AND (program_role.name = 'instructor'::text))))
        ), program_r AS (
         SELECT concat(program.app_id, ':program:', program.id) AS meta_urn,
            concat(program.app_id, ':program:', program.id) AS urn,
            program.id,
            program.title,
            pc.categories,
            pt.tags,
            pv.variants,
            pv.owners,
            program.app_id
           FROM (((public.program
             LEFT JOIN ( SELECT program_category.program_id,
                    (json_agg(category.name))::jsonb AS categories
                   FROM (public.program_category
                     JOIN public.category ON ((category.id = program_category.category_id)))
                  GROUP BY program_category.program_id) pc ON ((pc.program_id = program.id)))
             LEFT JOIN ( SELECT program_tag.program_id,
                    jsonb_agg(program_tag.tag_name) AS tags
                   FROM public.program_tag
                  GROUP BY program_tag.program_id) pt ON ((pt.program_id = program.id)))
             LEFT JOIN ( SELECT program_owners.program_id,
                    (json_agg(program_owners.name))::jsonb AS variants,
                    (json_agg(json_build_object('name', program_owners.name, 'id', program_owners.member_id)))::jsonb AS owners
                   FROM program_owners
                  GROUP BY program_owners.program_id) pv ON ((pv.program_id = program.id)))
          WHERE ((program.published_at IS NOT NULL) AND (program.is_deleted IS FALSE))
        ), activity_r AS (
         SELECT concat(activity.app_id, ':activity:', activity.id) AS meta_urn,
            concat(activity.app_id, ':activity:', activity.id) AS urn,
            activity.id,
            activity.title,
            ac.categories,
            ata.tags,
            av.variants,
            av.owners,
            activity.app_id
           FROM (((public.activity
             LEFT JOIN ( SELECT activity_category.activity_id,
                    (json_agg(category.name))::jsonb AS categories
                   FROM (public.activity_category
                     JOIN public.category ON ((category.id = activity_category.category_id)))
                  GROUP BY activity_category.activity_id) ac ON ((ac.activity_id = activity.id)))
             LEFT JOIN ( SELECT activity_1.id AS activity_id,
                    (json_agg(member.name))::jsonb AS variants,
                    (json_agg(json_build_object('name', member.name, 'id', member.id)))::jsonb AS owners
                   FROM (public.activity activity_1
                     JOIN public.member ON ((member.id = activity_1.organizer_id)))
                  GROUP BY activity_1.id) av ON ((av.activity_id = activity.id)))
             LEFT JOIN ( SELECT activity_tag.activity_id,
                    jsonb_agg(activity_tag.tag_name) AS tags
                   FROM public.activity_tag
                  GROUP BY activity_tag.activity_id) ata ON ((ata.activity_id = activity.id)))
          WHERE ((activity.published_at IS NOT NULL) AND (activity.deleted_at IS NULL))
        ), program_package_r AS (
         SELECT concat(program_package.app_id, ':program_package:', program_package.id) AS meta_urn,
            concat(program_package.app_id, ':program_package:', program_package.id) AS urn,
            program_package.id,
            program_package.title,
            pc.categories,
            NULL::jsonb AS tags,
            pv.variants,
            pv.owners,
            program_package.app_id
           FROM ((public.program_package
             LEFT JOIN ( SELECT program_package_category.program_package_id,
                    (json_agg(category.name))::jsonb AS categories
                   FROM (public.program_package_category
                     JOIN public.category ON ((category.id = program_package_category.category_id)))
                  GROUP BY program_package_category.program_package_id) pc ON ((pc.program_package_id = program_package.id)))
             LEFT JOIN ( SELECT program_package_program.program_package_id,
                    jsonb_agg(program.title) AS variants,
                    (json_agg(json_build_object('id', program_owners.member_id, 'name', program_owners.name)))::jsonb AS owners
                   FROM ((public.program_package_program
                     JOIN program_owners ON ((program_owners.program_id = program_package_program.program_id)))
                     JOIN public.program ON ((program_package_program.program_id = program.id)))
                  GROUP BY program_package_program.program_package_id) pv ON ((pv.program_package_id = program_package.id)))
          WHERE (program_package.published_at IS NOT NULL)
        ), program_plan_r AS (
         SELECT concat('program_plan:', program_plan.id) AS partial_urn,
            program_plan.program_id AS meta_id,
            program_plan.title,
                CASE
                    WHEN (((program_plan.sale_price IS NOT NULL) AND (program_plan.sold_at IS NULL)) OR (now() < program_plan.sold_at)) THEN program_plan.sale_price
                    ELSE program_plan.list_price
                END AS price,
            row_number() OVER (PARTITION BY program_plan.program_id ORDER BY program_plan.created_at DESC) AS "position",
            product.sku
           FROM (public.program_plan
             LEFT JOIN public.product ON ((product.id = concat('ProgramPlan_', program_plan.id))))
          WHERE ((program_plan.published_at IS NOT NULL) AND (program_plan.is_deleted IS FALSE))
        ), activity_ticket_r AS (
         SELECT concat('activity_ticket:', activity_ticket.id) AS partial_urn,
            activity_ticket.activity_id AS meta_id,
            activity_ticket.title,
            activity_ticket.price,
            row_number() OVER (PARTITION BY activity_ticket.activity_id ORDER BY activity_ticket.ended_at DESC) AS "position",
            product.sku
           FROM (public.activity_ticket
             LEFT JOIN public.product ON ((product.id = concat('ActivityTicket_', activity_ticket.id))))
          WHERE ((activity_ticket.is_published IS TRUE) AND (activity_ticket.deleted_at IS NULL))
        ), program_package_plan_r AS (
         SELECT concat('program_package_plan:', program_package_plan.id) AS partial_urn,
            program_package_plan.program_package_id AS meta_id,
            program_package_plan.title,
                CASE
                    WHEN (((program_package_plan.sale_price IS NOT NULL) AND (program_package_plan.sold_at IS NULL)) OR (now() < program_package_plan.sold_at)) THEN program_package_plan.sale_price
                    ELSE program_package_plan.list_price
                END AS price,
            row_number() OVER (PARTITION BY program_package_plan.program_package_id ORDER BY program_package_plan."position") AS "position",
            product.sku
           FROM (public.program_package_plan
             LEFT JOIN public.product ON ((product.id = concat('ProgramPackagePlan_', program_package_plan.id))))
          WHERE (program_package_plan.published_at < now())
        ), program_content_r AS (
         SELECT concat('program_content:', program_content.id) AS partial_urn,
            program_content_section.program_id AS meta_id,
            concat(program_content_section.title, ' - ', program_content.title) AS title,
                CASE
                    WHEN (((program_content.sale_price IS NOT NULL) AND (program_content.sold_at IS NULL)) OR (now() < program_content.sold_at)) THEN program_content.sale_price
                    ELSE program_content.list_price
                END AS price,
            row_number() OVER (PARTITION BY program_content_section.program_id ORDER BY program_content_section."position", program_content."position") AS "position"
           FROM (public.program_content
             JOIN public.program_content_section ON ((program_content.content_section_id = program_content_section.id)))
        ), post_r AS (
         SELECT concat(p.app_id, ':post:', p.id) AS id,
            p.title AS name,
            NULL::numeric AS price,
            pc.categories,
            pt.tags,
            pr.variants,
            pr.owners,
            NULL::text AS sku,
            p.app_id,
            concat(p.app_id, ':post:', p.id) AS meta_id
           FROM (((public.post p
             LEFT JOIN ( SELECT post_category.post_id,
                    jsonb_agg(category.name) AS categories
                   FROM (public.post_category
                     JOIN public.category ON ((post_category.category_id = category.id)))
                  GROUP BY post_category.post_id) pc ON ((p.id = pc.post_id)))
             LEFT JOIN ( SELECT post_role.post_id,
                    jsonb_agg(json_build_object('name', member.name, 'id', member.id)) AS owners,
                    jsonb_agg(member.name) AS variants
                   FROM (public.post_role
                     JOIN public.member ON (((post_role.member_id = member.id) AND (post_role.name = 'author'::text))))
                  GROUP BY post_role.post_id) pr ON ((pr.post_id = p.id)))
             LEFT JOIN ( SELECT post_tag.post_id,
                    jsonb_agg(post_tag.tag_name) AS tags
                   FROM public.post_tag
                  GROUP BY post_tag.post_id) pt ON ((p.id = pt.post_id)))
        )
 SELECT concat(pr.app_id, ':', program_content_r.partial_urn) AS id,
    program_content_r.title AS name,
    program_content_r.price,
    pr.categories,
    pr.tags,
    jsonb_agg(pr.title) OVER (PARTITION BY program_content_r.partial_urn) AS variants,
    pr.owners,
    pr.sku,
    pr.app_id,
    pr.meta_urn AS meta_id
   FROM (program_content_r
     JOIN ( SELECT DISTINCT ON (program_r.urn) program_r.meta_urn,
            program_r.urn,
            program_r.id,
            program_r.title,
            program_r.categories,
            program_r.tags,
            program_r.variants,
            program_r.owners,
            program_r.app_id,
            string_agg(program_plan_r.sku, '|'::text) OVER (PARTITION BY program_r.id ORDER BY program_plan_r."position") AS sku
           FROM (program_r
             JOIN program_plan_r ON ((program_r.id = program_plan_r.meta_id)))) pr ON ((pr.id = program_content_r.meta_id)))
UNION
 SELECT concat(ppr.app_id, ':', pppr.partial_urn) AS id,
    concat(ppr.title, '|', pppr.title) AS name,
    pppr.price,
    ppr.categories,
    ppr.tags,
    ppr.variants,
    ppr.owners,
    pppr.sku,
    ppr.app_id,
    ppr.meta_urn AS meta_id
   FROM (program_package_plan_r pppr
     JOIN program_package_r ppr ON ((ppr.id = pppr.meta_id)))
UNION
 SELECT DISTINCT ON (ppr.urn) ppr.urn AS id,
    ppr.title AS name,
    first_value(pppr.price) OVER (PARTITION BY ppr.id ORDER BY pppr."position") AS price,
    ppr.categories,
    ppr.tags,
    ppr.variants,
    ppr.owners,
    string_agg(pppr.sku, '|'::text) OVER (PARTITION BY ppr.id ORDER BY pppr."position") AS sku,
    ppr.app_id,
    ppr.meta_urn AS meta_id
   FROM (program_package_r ppr
     JOIN program_package_plan_r pppr ON ((ppr.id = pppr.meta_id)))
UNION
 SELECT concat(activity_r.app_id, ':', activity_ticket_r.partial_urn) AS id,
    concat(activity_r.title, '|', activity_ticket_r.title) AS name,
    activity_ticket_r.price,
    activity_r.categories,
    activity_r.tags,
    activity_r.variants,
    activity_r.owners,
    activity_ticket_r.sku,
    activity_r.app_id,
    activity_r.meta_urn AS meta_id
   FROM (activity_ticket_r
     JOIN activity_r ON ((activity_ticket_r.meta_id = activity_r.id)))
UNION
 SELECT DISTINCT ON (activity_r.urn) activity_r.urn AS id,
    activity_r.title AS name,
    first_value(activity_ticket_r.price) OVER (PARTITION BY activity_r.id ORDER BY activity_ticket_r."position") AS price,
    activity_r.categories,
    activity_r.tags,
    activity_r.variants,
    activity_r.owners,
    string_agg(activity_ticket_r.sku, '|'::text) OVER (PARTITION BY activity_r.id ORDER BY activity_ticket_r."position") AS sku,
    activity_r.app_id,
    activity_r.meta_urn AS meta_id
   FROM (activity_r
     JOIN activity_ticket_r ON ((activity_r.id = activity_ticket_r.meta_id)))
UNION
 SELECT concat(program_r.app_id, ':', program_plan_r.partial_urn) AS id,
    concat(program_r.title, '|', program_plan_r.title) AS name,
    program_plan_r.price,
    program_r.categories,
    program_r.tags,
    program_r.variants,
    program_r.owners,
    program_plan_r.sku,
    program_r.app_id,
    program_r.meta_urn AS meta_id
   FROM (program_plan_r
     JOIN program_r ON ((program_plan_r.meta_id = program_r.id)))
UNION
 SELECT DISTINCT ON (program_r.urn) program_r.urn AS id,
    program_r.title AS name,
    first_value(program_plan_r.price) OVER (PARTITION BY program_r.id ORDER BY program_plan_r."position") AS price,
    program_r.categories,
    program_r.tags,
    program_r.variants,
    program_r.owners,
    string_agg(program_plan_r.sku, '|'::text) OVER (PARTITION BY program_r.id ORDER BY program_plan_r."position") AS sku,
    program_r.app_id,
    program_r.meta_urn AS meta_id
   FROM (program_r
     JOIN program_plan_r ON ((program_r.id = program_plan_r.meta_id)))
UNION
 SELECT post_r.id,
    post_r.name,
    post_r.price,
    post_r.categories,
    post_r.tags,
    post_r.variants,
    post_r.owners,
    post_r.sku,
    post_r.app_id,
    post_r.meta_id
   FROM post_r;
CREATE VIEW public.review_public AS
 SELECT review.id,
    review.path,
    review.score,
    review.title,
    review.content,
    review.member_id,
    member.picture_url,
    member.name,
    member.username,
    review.app_id,
    review.created_at,
    review.updated_at
   FROM (public.review
     JOIN public.member ON ((review.member_id = member.id)));
CREATE TABLE public.review_reaction (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    review_id uuid NOT NULL,
    member_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.review_reply (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    review_id uuid NOT NULL,
    member_id text NOT NULL,
    content text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.role (
    id text DEFAULT public.gen_random_uuid() NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE VIEW public.sales_active_log AS
SELECT
    NULL::text AS id,
    NULL::text AS event,
    NULL::text AS sales_id,
    NULL::text AS member_id,
    NULL::timestamp with time zone AS created_at,
    NULL::timestamp with time zone AS agreed_at,
    NULL::timestamp with time zone AS revoked_at,
    NULL::numeric AS price,
    NULL::timestamp with time zone AS due_at,
    NULL::text AS status,
    NULL::timestamp with time zone AS rejected_at,
    NULL::integer AS duration,
    NULL::bigint AS past_count,
    NULL::timestamp with time zone AS started_at,
    NULL::timestamp with time zone AS ended_at,
    NULL::text AS type;
CREATE TABLE public.service (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    name text NOT NULL,
    gateway text NOT NULL,
    catalog text NOT NULL,
    options jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT catalog_constraint CHECK ((catalog = 'meeting'::text)),
    CONSTRAINT gateway_constraint CHECK ((gateway = ANY (ARRAY['zoom'::text, 'webex'::text])))
);
CREATE TABLE public.setting (
    key text NOT NULL,
    type text DEFAULT 'string'::text NOT NULL,
    options jsonb,
    is_protected boolean DEFAULT false NOT NULL,
    is_required boolean DEFAULT false NOT NULL,
    module_id text,
    is_secret boolean DEFAULT false NOT NULL,
    CONSTRAINT type_constraint CHECK ((type = ANY (ARRAY['string'::text, 'number'::text, 'boolean'::text])))
);
COMMENT ON COLUMN public.setting.type IS 'string | number | boolean';
CREATE TABLE public.signup_property (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    app_id text NOT NULL,
    type text NOT NULL,
    property_id uuid NOT NULL,
    is_required boolean NOT NULL,
    options jsonb,
    "position" integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.signup_property IS 'custom signup form';
COMMENT ON COLUMN public.signup_property.type IS 'input, checkbox, radio, select, textarea';
CREATE TABLE public.sms_verification_code (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    code text NOT NULL,
    app_id text NOT NULL,
    expired_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    phone text NOT NULL
);
CREATE TABLE public.social_card (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    member_social_id uuid NOT NULL,
    membership_id text,
    name text NOT NULL,
    badge_url text,
    description text
);
CREATE TABLE public.social_card_subscriber (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    member_id text,
    social_card_id uuid NOT NULL,
    member_channel_id text,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    ended_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE VIEW public.social_card_enrollment AS
 SELECT social_card.id AS social_card_id,
    member.id AS member_id,
    social_card_subscriber.started_at,
    social_card_subscriber.ended_at
   FROM ((public.social_card
     JOIN public.social_card_subscriber ON ((social_card_subscriber.social_card_id = social_card.id)))
     JOIN ( SELECT member_1.id,
            member_1.app_id,
            member_1.roles_deprecated,
            member_1.name,
            member_1.email,
            member_1.picture_url,
            member_1.metadata,
            member_1.description,
            member_1.created_at,
            member_1.logined_at,
            member_1.username,
            member_1.passhash,
            member_1.facebook_user_id,
            member_1.google_user_id,
            member_1.abstract,
            member_1.title,
            member_1.role,
            member_1.refresh_token,
            member_1.zoom_user_id_deprecate,
            member_1.youtube_channel_ids,
            jsonb_array_elements_text(member_1.youtube_channel_ids) AS youtube_channel_id
           FROM public.member member_1) member ON ((member.youtube_channel_id = social_card_subscriber.member_channel_id)));
CREATE TABLE public.table_log (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    member_id text NOT NULL,
    table_name text NOT NULL,
    old jsonb,
    new jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.table_log IS 'transaction record';
CREATE TABLE public.tag (
    name text DEFAULT public.gen_random_uuid() NOT NULL,
    type text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    filterable boolean DEFAULT true NOT NULL
);
CREATE MATERIALIZED VIEW public.tese_imv AS
 SELECT member_note.id
   FROM (public.member_note
     JOIN public.member ON ((member.id = member_note.member_id)))
  WITH NO DATA;
CREATE TABLE public.token (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    app_id text NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    cover_url text,
    price numeric DEFAULT 0 NOT NULL,
    currency_id text DEFAULT 'TWD'::text NOT NULL,
    is_deliverable boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    abstract text,
    description text,
    tag text,
    sale_price numeric,
    plan text,
    options jsonb,
    is_deleted boolean DEFAULT false NOT NULL,
    views integer DEFAULT 0 NOT NULL,
    clicks integer DEFAULT 0 NOT NULL
);
COMMENT ON TABLE public.token IS '放自定義產品，Ex: gift, service, NFT';
COMMENT ON COLUMN public.token.price IS 'list price';
CREATE TABLE public."user" (
    id text DEFAULT public.gen_random_uuid() NOT NULL,
    org_id text NOT NULL,
    name text DEFAULT '未命名使用者'::text NOT NULL,
    email text NOT NULL,
    picture_url text,
    metadata jsonb DEFAULT jsonb_build_object() NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    logined_at timestamp with time zone,
    username text NOT NULL,
    passhash text,
    role text NOT NULL,
    refresh_token uuid DEFAULT public.gen_random_uuid() NOT NULL,
    phone text
);
COMMENT ON TABLE public."user" IS 'org member';
CREATE TABLE public.user_oauth (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    provider text NOT NULL,
    provider_user_id text NOT NULL,
    options jsonb,
    CONSTRAINT provider_constraint CHECK ((provider = ANY (ARRAY['facebook'::text, 'google'::text, 'line'::text, 'line-notify'::text, 'parenting'::text, 'commonhealth'::text, 'cw'::text])))
);
CREATE TABLE public.user_permission (
    user_id text DEFAULT public.gen_random_uuid() NOT NULL,
    permission_id text NOT NULL,
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.venue (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    name text NOT NULL,
    cols integer DEFAULT 1 NOT NULL,
    rows integer DEFAULT 1 NOT NULL,
    seats integer DEFAULT 4 NOT NULL,
    app_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);
CREATE TABLE public.venue_seat (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    venue_id uuid NOT NULL,
    "position" integer NOT NULL,
    disabled boolean DEFAULT false NOT NULL,
    category text
);
CREATE TABLE public.voucher_category (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    voucher_plan_id uuid NOT NULL,
    category_id text NOT NULL,
    "position" integer DEFAULT 0 NOT NULL
);
CREATE TABLE public.voucher_plan_category (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    voucher_plan_id uuid NOT NULL,
    category_id text NOT NULL,
    "position" numeric DEFAULT '0'::numeric NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE public.voucher_plan_product (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    voucher_plan_id uuid NOT NULL,
    product_id text NOT NULL
);
CREATE VIEW public.voucher_status AS
 SELECT DISTINCT voucher.id AS voucher_id,
    (((voucher_plan.started_at IS NOT NULL) AND (voucher_plan.started_at > now())) OR ((voucher_plan.ended_at IS NOT NULL) AND (voucher_plan.ended_at < now()))) AS outdated,
    (t.order_id IS NOT NULL) AS used
   FROM (((public.voucher
     JOIN public.voucher_code ON ((voucher.voucher_code_id = voucher_code.id)))
     JOIN public.voucher_plan ON ((voucher_code.voucher_plan_id = voucher_plan.id)))
     LEFT JOIN ( SELECT order_discount.target,
            order_discount.order_id,
            order_log.status
           FROM (public.order_discount
             JOIN public.order_log ON (((order_log.id = order_discount.order_id) AND (order_log.status = 'SUCCESS'::text))))) t ON (((voucher.id)::text = t.target)));
CREATE TABLE public.webhook_log (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    event text NOT NULL,
    payload text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    app_id text DEFAULT 'NULL'::text,
    detail jsonb
);
ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);
ALTER TABLE ONLY public.program_package_category ALTER COLUMN "position" SET DEFAULT nextval('public.program_package_category_position_seq'::regclass);
ALTER TABLE ONLY public.member_note
    ADD CONSTRAINT member_note_pkey PRIMARY KEY (id);
CREATE MATERIALIZED VIEW public.sales_activeness AS
 WITH sales AS (
         SELECT member.id,
            member.name
           FROM ((public.member
             JOIN public.member_property ON ((member_property.member_id = member.id)))
             JOIN public.property ON ((property.id = member_property.property_id)))
          WHERE (property.name = '分機號碼'::text)
        ), interval_time_notes AS (
         SELECT member_note_1.id,
            member_note_1.member_id,
            member_note_1.author_id,
            member_note_1.type,
            member_note_1.status,
            member_note_1.duration,
            member_note_1.description,
            member_note_1.created_at,
            member_note_1.updated_at,
            member_note_1.metadata,
            member_note_1.note,
            member_note_1.rejected_at,
            timezone('UTC'::text, to_timestamp((floor((date_part('epoch'::text, member_note_1.created_at) / (3600)::double precision)) * (3600)::double precision))) AS interval_time
           FROM public.member_note member_note_1
          WHERE (member_note_1.type = 'outbound'::text)
          GROUP BY member_note_1.id, (timezone('UTC'::text, to_timestamp((floor((date_part('epoch'::text, member_note_1.created_at) / (3600)::double precision)) * (3600)::double precision))))
        ), assigned_members AS (
         SELECT member.id,
            member.manager_id
           FROM public.member
          WHERE (member.assigned_at IS NOT NULL)
        ), reservation_demo_members AS (
         SELECT member_task.member_id,
            member_task.status,
            member_task.due_at,
            member_task.created_at
           FROM (public.member_task
             JOIN public.category ON ((category.id = member_task.category_id)))
          WHERE (category.name = '預約DEMO'::text)
        ), contract AS (
         SELECT member_contract.member_id,
            member_contract.agreed_at,
            member_contract.agreed_at AS revoked_at,
            (member_contract."values" -> 'price'::text) AS price,
            ((member_contract."values" -> 'orderExecutors'::text) -> 'member_id'::text) AS order_executor_id
           FROM public.member_contract
        ), t AS (
         SELECT member_contract.id,
            (member_contract."values" -> 'orderExecutors'::text) AS orderexecutors,
            (member_contract."values" -> 'price'::text) AS price
           FROM public.member_contract
        ), performance AS (
         SELECT t.id,
            t.orderexecutors,
            t.price,
            items.ratio,
            items.member_id
           FROM t,
            LATERAL jsonb_to_recordset(t.orderexecutors) items(ratio text, member_id text)
        )
 SELECT sales.id,
    sales.name,
    interval_time_notes.interval_time,
        CASE
            WHEN ((interval_time_notes.duration > 90) AND (interval_time_notes.status = 'answered'::text)) THEN sum(interval_time_notes.duration)
            ELSE (0)::bigint
        END AS duration,
        CASE
            WHEN (interval_time_notes.duration > 90) THEN count(interval_time_notes.id)
            ELSE (0)::bigint
        END AS dial,
        CASE
            WHEN ((interval_time_notes.duration > 90) AND (interval_time_notes.status = 'answered'::text)) THEN count(interval_time_notes.id)
            ELSE (0)::bigint
        END AS answered,
        CASE
            WHEN (interval_time_notes.status = 'missed'::text) THEN count(interval_time_notes.id)
            ELSE (0)::bigint
        END AS epmty_number,
        CASE
            WHEN ((interval_time_notes.duration > 90) AND (interval_time_notes.rejected_at IS NOT NULL)) THEN count(interval_time_notes.id)
            ELSE (0)::bigint
        END AS refuse,
        CASE
            WHEN ((interval_time_notes.duration > 90) AND (interval_time_notes.status = 'answered'::text) AND (interval_time_notes.rejected_at IS NULL)) THEN count(interval_time_notes.id)
            ELSE (0)::bigint
        END AS not_first_rejection,
        CASE
            WHEN (interval_time_notes.member_id IN ( SELECT reservation_demo_members.member_id
               FROM reservation_demo_members
              WHERE ((reservation_demo_members.created_at > interval_time_notes.interval_time) AND (reservation_demo_members.created_at < (interval_time_notes.interval_time + '01:00:00'::interval))))) THEN count(interval_time_notes.member_id)
            ELSE (0)::bigint
        END AS reservation_demo,
        CASE
            WHEN (interval_time_notes.member_id IN ( SELECT reservation_demo_members.member_id
               FROM reservation_demo_members
              WHERE ((reservation_demo_members.status = 'done'::text) AND (reservation_demo_members.due_at > interval_time_notes.interval_time) AND (reservation_demo_members.due_at < (interval_time_notes.interval_time + '01:00:00'::interval))))) THEN count(interval_time_notes.member_id)
            ELSE (0)::bigint
        END AS is_demoed,
        CASE
            WHEN ((contract.agreed_at > interval_time_notes.interval_time) AND (contract.agreed_at < (interval_time_notes.interval_time + '01:00:00'::interval))) THEN count(contract.member_id)
            ELSE (0)::bigint
        END AS deal,
        CASE
            WHEN ((contract.agreed_at > interval_time_notes.interval_time) AND (contract.agreed_at < (interval_time_notes.interval_time + '01:00:00'::interval))) THEN
            CASE
                WHEN (performance.member_id = member_note.author_id) THEN ((performance.ratio)::numeric * (performance.price)::numeric)
                ELSE (0)::numeric
            END
            ELSE (0)::numeric
        END AS performance,
        CASE
            WHEN ((contract.revoked_at > interval_time_notes.interval_time) AND (contract.revoked_at < (interval_time_notes.interval_time + '01:00:00'::interval))) THEN
            CASE
                WHEN (performance.member_id = member_note.author_id) THEN ((performance.ratio)::numeric * (performance.price)::numeric)
                ELSE (0)::numeric
            END
            ELSE (0)::numeric
        END AS revoked_amount
   FROM (((((public.member_note
     JOIN sales ON ((sales.id = member_note.author_id)))
     JOIN interval_time_notes ON ((interval_time_notes.id = member_note.id)))
     LEFT JOIN assigned_members ON ((assigned_members.id = member_note.member_id)))
     LEFT JOIN contract ON ((contract.member_id = member_note.member_id)))
     LEFT JOIN performance ON ((performance.member_id = member_note.author_id)))
  GROUP BY sales.id, sales.name, interval_time_notes.duration, interval_time_notes.interval_time, interval_time_notes.type, interval_time_notes.status, interval_time_notes.rejected_at, interval_time_notes.member_id, contract.agreed_at, contract.revoked_at, performance.member_id, member_note.author_id, performance.ratio, performance.price, assigned_members.manager_id
  ORDER BY interval_time_notes.interval_time, sales.name
  WITH NO DATA;
ALTER TABLE ONLY public.app
    ADD CONSTRAINT "App_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY (id);
ALTER TABLE ONLY public.member
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public.achievement_template
    ADD CONSTRAINT achievement_template_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.activity_attendance
    ADD CONSTRAINT activity_attendance_order_product_id_activity_session_id_key UNIQUE (order_product_id, activity_session_id);
ALTER TABLE ONLY public.activity_attendance
    ADD CONSTRAINT activity_attendance_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.activity_category
    ADD CONSTRAINT activity_category_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.activity
    ADD CONSTRAINT activity_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.activity_session
    ADD CONSTRAINT activity_session_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.activity_session_ticket
    ADD CONSTRAINT activity_session_ticket_activity_session_id_activity_ticket_id_ UNIQUE (activity_session_id, activity_ticket_id, activity_session_type);
ALTER TABLE ONLY public.activity_session_ticket
    ADD CONSTRAINT activity_session_ticket_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.activity_tag
    ADD CONSTRAINT activity_tag_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.activity_ticket
    ADD CONSTRAINT activity_ticket_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.app_achievement
    ADD CONSTRAINT app_achievement_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.app_admin
    ADD CONSTRAINT app_admin_pkey PRIMARY KEY (host);
ALTER TABLE ONLY public.app_channel
    ADD CONSTRAINT app_channel_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.app_default_permission
    ADD CONSTRAINT app_default_permission_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.app_email_template
    ADD CONSTRAINT app_email_template_app_id_catalog_key UNIQUE (app_id, catalog);
ALTER TABLE ONLY public.app_email_template
    ADD CONSTRAINT app_email_template_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.app_extended_module
    ADD CONSTRAINT app_extended_module_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.app_host
    ADD CONSTRAINT app_host_pkey PRIMARY KEY (host);
ALTER TABLE ONLY public.app_language
    ADD CONSTRAINT app_language_app_id_language_key UNIQUE (app_id, language);
ALTER TABLE ONLY public.app_language
    ADD CONSTRAINT app_language_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.app_nav
    ADD CONSTRAINT app_nav_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.app_page
    ADD CONSTRAINT app_page_path_app_id_is_deleted_key UNIQUE (path, app_id, is_deleted);
ALTER TABLE ONLY public.app_page
    ADD CONSTRAINT app_page_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.app_page_section
    ADD CONSTRAINT app_page_section_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.app_page_template
    ADD CONSTRAINT app_page_template_author_id_name_key UNIQUE (author_id, name);
ALTER TABLE ONLY public.app_page_template
    ADD CONSTRAINT app_page_template_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.app_plan_module
    ADD CONSTRAINT app_plan_module_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.app_plan
    ADD CONSTRAINT app_plan_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.app_secret
    ADD CONSTRAINT app_secret_app_id_key_key UNIQUE (app_id, key);
ALTER TABLE ONLY public.app_secret
    ADD CONSTRAINT app_secret_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.app_setting
    ADD CONSTRAINT app_setting_app_id_key_key UNIQUE (app_id, key);
ALTER TABLE ONLY public.app_setting
    ADD CONSTRAINT app_setting_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.app
    ADD CONSTRAINT app_symbol_key UNIQUE (symbol);
ALTER TABLE ONLY public.app_usage
    ADD CONSTRAINT app_usage_pkey PRIMARY KEY (app_id, date_hour);
ALTER TABLE ONLY public.app_webhook
    ADD CONSTRAINT app_webhook_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.appointment_plan
    ADD CONSTRAINT appointment_plan_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.appointment_schedule
    ADD CONSTRAINT appointment_schedule_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.attachment
    ADD CONSTRAINT attachment_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.attend
    ADD CONSTRAINT attend_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.bundle_item
    ADD CONSTRAINT bundle_item_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.bundle
    ADD CONSTRAINT bundle_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.card_discount
    ADD CONSTRAINT card_discount_card_id_product_id_key UNIQUE (card_id, product_id);
ALTER TABLE ONLY public.card_discount
    ADD CONSTRAINT card_discount_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.card
    ADD CONSTRAINT card_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.cart_item
    ADD CONSTRAINT cart_item_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.cart_product
    ADD CONSTRAINT cart_product_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.category
    ADD CONSTRAINT category_app_id_class_name_key UNIQUE (app_id, class, name);
ALTER TABLE ONLY public.category
    ADD CONSTRAINT category_id_key UNIQUE (id);
ALTER TABLE ONLY public.category
    ADD CONSTRAINT category_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.certificate
    ADD CONSTRAINT certificate_code_app_id_key UNIQUE (code, app_id);
ALTER TABLE ONLY public.certificate
    ADD CONSTRAINT certificate_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.certificate_template
    ADD CONSTRAINT certificate_template_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.coin_log
    ADD CONSTRAINT coin_log_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.comment
    ADD CONSTRAINT comment_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.comment_reaction
    ADD CONSTRAINT comment_reaction_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.comment_reply
    ADD CONSTRAINT comment_reply_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.comment_reply_reaction
    ADD CONSTRAINT comment_reply_reaction_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.contract
    ADD CONSTRAINT contract_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.coupon
    ADD CONSTRAINT coupon_member_id_coupon_code_id_key UNIQUE (member_id, coupon_code_id);
ALTER TABLE ONLY public.coupon
    ADD CONSTRAINT coupon_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.coupon_code
    ADD CONSTRAINT coupon_plan_code_app_id_code_key UNIQUE (app_id, code);
ALTER TABLE ONLY public.coupon_code
    ADD CONSTRAINT coupon_plan_code_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.coupon_plan
    ADD CONSTRAINT coupon_plan_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.coupon_plan_product
    ADD CONSTRAINT coupon_plan_product_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.creator_category
    ADD CONSTRAINT creator_category_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.creator_display
    ADD CONSTRAINT creator_display_member_id_block_id_key UNIQUE (member_id, block_id);
ALTER TABLE ONLY public.creator_display
    ADD CONSTRAINT creator_display_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.currency
    ADD CONSTRAINT currency_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.email_template
    ADD CONSTRAINT email_template_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.estimator
    ADD CONSTRAINT estimator_id_key UNIQUE (id);
ALTER TABLE ONLY public.estimator
    ADD CONSTRAINT estimator_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.exam_member_time_limit
    ADD CONSTRAINT exam_member_time_limit_exam_id_member_id_key UNIQUE (exam_id, member_id);
ALTER TABLE ONLY public.exam_member_time_limit
    ADD CONSTRAINT exam_member_time_limit_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.exam
    ADD CONSTRAINT exam_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.exam_question_group
    ADD CONSTRAINT exam_question_group_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.exercise
    ADD CONSTRAINT exercise_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.file
    ADD CONSTRAINT file_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.gift_plan
    ADD CONSTRAINT gift_plan_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.gift_plan_product
    ADD CONSTRAINT gift_plan_product_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.identity
    ADD CONSTRAINT identity_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT invoice_order_id_key UNIQUE (order_id);
ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT invoice_pkey PRIMARY KEY (no);
ALTER TABLE ONLY public.issue
    ADD CONSTRAINT issue_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.issue_reaction
    ADD CONSTRAINT issue_reaction_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.issue_reply
    ADD CONSTRAINT issue_reply_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.issue_reply_reaction
    ADD CONSTRAINT issue_reply_reaction_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.iszn_coupon
    ADD CONSTRAINT iszn_coupon_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.iszn_coupon_usage
    ADD CONSTRAINT iszn_coupon_usage_pkey PRIMARY KEY ("unique");
ALTER TABLE ONLY public.iszn_coursecontent
    ADD CONSTRAINT iszn_coursecontent_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.iszn_coursediscussion
    ADD CONSTRAINT iszn_coursediscussion_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.iszn_coursediscussionreaction
    ADD CONSTRAINT iszn_coursediscussionreaction_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.iszn_coursereply
    ADD CONSTRAINT iszn_coursereply_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.iszn_coursereplyreaction
    ADD CONSTRAINT iszn_coursereplyreaction_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.iszn_courseunit
    ADD CONSTRAINT iszn_courseunit_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.iszn_invoice
    ADD CONSTRAINT iszn_invoice_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.iszn_order_item
    ADD CONSTRAINT iszn_order_item_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.iszn_order
    ADD CONSTRAINT iszn_order_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.iszn_user
    ADD CONSTRAINT iszn_user_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.locale
    ADD CONSTRAINT locale_pkey PRIMARY KEY (key);
ALTER TABLE ONLY public.media
    ADD CONSTRAINT media_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.meet
    ADD CONSTRAINT meet_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.member_achievement
    ADD CONSTRAINT member_achievement_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.member
    ADD CONSTRAINT member_app_id_email_key UNIQUE (app_id, email);
ALTER TABLE ONLY public.member
    ADD CONSTRAINT member_app_id_username_key UNIQUE (app_id, username);
ALTER TABLE ONLY public.member_card
    ADD CONSTRAINT member_card_id_key UNIQUE (id);
ALTER TABLE ONLY public.member_card
    ADD CONSTRAINT member_card_member_id_card_identifier_key UNIQUE (member_id, card_identifier);
ALTER TABLE ONLY public.member_card
    ADD CONSTRAINT member_card_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.member_category
    ADD CONSTRAINT member_category_member_id_category_id_key UNIQUE (member_id, category_id);
ALTER TABLE ONLY public.member_category
    ADD CONSTRAINT member_category_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.member_certificate
    ADD CONSTRAINT member_certificate_certificate_id_member_id_number_key UNIQUE (certificate_id, member_id, number);
ALTER TABLE ONLY public.member_certificate
    ADD CONSTRAINT member_certificate_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.member_contract
    ADD CONSTRAINT member_contract_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.member_device
    ADD CONSTRAINT member_device_id_key UNIQUE (id);
ALTER TABLE ONLY public.member_device
    ADD CONSTRAINT member_device_member_id_fingerprint_id_key UNIQUE (member_id, fingerprint_id);
ALTER TABLE ONLY public.member_device
    ADD CONSTRAINT member_device_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.member_learned_log
    ADD CONSTRAINT member_learned_log_member_id_period_key UNIQUE (member_id, period);
ALTER TABLE ONLY public.member_learned_log
    ADD CONSTRAINT member_learned_log_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.member
    ADD CONSTRAINT member_line_user_id_app_id_key UNIQUE (line_user_id, app_id);
ALTER TABLE ONLY public.member_oauth
    ADD CONSTRAINT member_oauth_member_id_provider_key UNIQUE (member_id, provider);
ALTER TABLE ONLY public.member_oauth
    ADD CONSTRAINT member_oauth_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.member_permission_group
    ADD CONSTRAINT member_permission_group_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.member_permission_extra
    ADD CONSTRAINT member_permission_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.member_phone
    ADD CONSTRAINT member_phone_member_id_phone_key UNIQUE (member_id, phone);
ALTER TABLE ONLY public.member_phone
    ADD CONSTRAINT member_phone_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.member_property
    ADD CONSTRAINT member_property_member_id_property_id_key UNIQUE (member_id, property_id);
ALTER TABLE ONLY public.member_property
    ADD CONSTRAINT member_property_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.member
    ADD CONSTRAINT member_refresh_token_key UNIQUE (refresh_token);
ALTER TABLE ONLY public.member_shop
    ADD CONSTRAINT member_shop_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.member_social
    ADD CONSTRAINT member_social_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.member_social
    ADD CONSTRAINT member_social_type_channel_id_key UNIQUE (type, channel_id);
ALTER TABLE ONLY public.member_speciality
    ADD CONSTRAINT member_speciality_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.member_tag
    ADD CONSTRAINT member_tag_member_id_tag_name_key UNIQUE (member_id, tag_name);
ALTER TABLE ONLY public.member_tag
    ADD CONSTRAINT member_tag_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.member_task
    ADD CONSTRAINT member_task_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.member_tracking_log
    ADD CONSTRAINT member_tracking_log_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.member
    ADD CONSTRAINT member_zoom_user_id_key UNIQUE (zoom_user_id_deprecate);
ALTER TABLE ONLY public.merchandise_category
    ADD CONSTRAINT merchandise_category_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.merchandise_file
    ADD CONSTRAINT merchandise_file_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.merchandise_img
    ADD CONSTRAINT merchandise_img_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.merchandise
    ADD CONSTRAINT merchandise_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.merchandise_spec_file
    ADD CONSTRAINT merchandise_spec_file_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.merchandise_spec
    ADD CONSTRAINT merchandise_spec_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.merchandise_tag
    ADD CONSTRAINT merchandise_tag_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.module
    ADD CONSTRAINT module_id_key UNIQUE (id);
ALTER TABLE ONLY public.module
    ADD CONSTRAINT module_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.order_contact
    ADD CONSTRAINT order_contact_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.order_discount
    ADD CONSTRAINT order_discount_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.order_executor
    ADD CONSTRAINT order_executor_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.order_log
    ADD CONSTRAINT order_log_custom_id_key UNIQUE (custom_id);
ALTER TABLE ONLY public.order_log
    ADD CONSTRAINT order_log_id_key UNIQUE (id);
ALTER TABLE ONLY public.order_log
    ADD CONSTRAINT order_log_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.order_product_file
    ADD CONSTRAINT order_product_file_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.order_product
    ADD CONSTRAINT order_product_order_id_name_product_id_key UNIQUE (order_id, name, product_id);
ALTER TABLE ONLY public.order_product
    ADD CONSTRAINT order_product_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.org
    ADD CONSTRAINT organization_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.package_item_group
    ADD CONSTRAINT package_item_group_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.package_item
    ADD CONSTRAINT package_item_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.package
    ADD CONSTRAINT package_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.package_section
    ADD CONSTRAINT package_section_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.payment_log
    ADD CONSTRAINT payment_log_custom_no_key UNIQUE (custom_no);
ALTER TABLE ONLY public.payment_log
    ADD CONSTRAINT payment_log_no_key UNIQUE (no);
ALTER TABLE ONLY public.payment_log
    ADD CONSTRAINT payment_log_pkey PRIMARY KEY (no);
ALTER TABLE ONLY public.permission_group
    ADD CONSTRAINT permission_group_name_app_id_key UNIQUE (name, app_id);
ALTER TABLE ONLY public.permission_group_permission
    ADD CONSTRAINT permission_group_permission_permission_group_id_permission_id_k UNIQUE (permission_group_id, permission_id);
ALTER TABLE ONLY public.permission_group_permission
    ADD CONSTRAINT permission_group_permission_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.permission_group
    ADD CONSTRAINT permission_group_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.permission
    ADD CONSTRAINT permission_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.playlist
    ADD CONSTRAINT playlist_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.playlist_podcast_program
    ADD CONSTRAINT playlist_podcast_program_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.podcast_album_category
    ADD CONSTRAINT podcast_album_category_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.podcast_album
    ADD CONSTRAINT podcast_album_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.podcast_album_podcast_program
    ADD CONSTRAINT podcast_album_podcast_program_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.podcast_album_podcast_program
    ADD CONSTRAINT podcast_album_podcast_program_podcast_album_id_podcast_program_ UNIQUE (podcast_album_id, podcast_program_id);
ALTER TABLE ONLY public.podcast
    ADD CONSTRAINT podcast_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.podcast_plan
    ADD CONSTRAINT podcast_plan_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.podcast_program_audio
    ADD CONSTRAINT podcast_program_audio_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.podcast_program_body
    ADD CONSTRAINT podcast_program_body_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.podcast_program_category
    ADD CONSTRAINT podcast_program_category_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.podcast_program
    ADD CONSTRAINT podcast_program_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.podcast_program_progress
    ADD CONSTRAINT podcast_program_progress_member_id_podcast_program_id_key UNIQUE (member_id, podcast_program_id);
ALTER TABLE ONLY public.podcast_program_progress
    ADD CONSTRAINT podcast_program_progress_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.podcast_program_role
    ADD CONSTRAINT podcast_program_role_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.podcast_program_tag
    ADD CONSTRAINT podcast_program_tag_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.podcast_program_tag
    ADD CONSTRAINT podcast_program_tag_podcast_program_id_tag_name_key UNIQUE (podcast_program_id, tag_name);
ALTER TABLE ONLY public.point_log
    ADD CONSTRAINT point_log_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.post_category
    ADD CONSTRAINT post_category_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.post_merchandise
    ADD CONSTRAINT post_merchandise_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.post
    ADD CONSTRAINT post_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.post_reaction
    ADD CONSTRAINT post_reaction_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.post_role
    ADD CONSTRAINT post_role_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.post_tag
    ADD CONSTRAINT post_tag_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.practice
    ADD CONSTRAINT practice_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.practice_reaction
    ADD CONSTRAINT practice_reaction_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.product_channel
    ADD CONSTRAINT product_channel_app_id_channel_sku_key UNIQUE (app_id, channel_sku);
ALTER TABLE ONLY public.product_channel
    ADD CONSTRAINT product_channel_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.product_channel
    ADD CONSTRAINT product_channel_product_id_channel_id_key UNIQUE (product_id, channel_id);
ALTER TABLE ONLY public.product_gift_plan
    ADD CONSTRAINT product_gift_plan_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.product
    ADD CONSTRAINT product_id_key UNIQUE (id);
ALTER TABLE ONLY public.product_inventory
    ADD CONSTRAINT product_inventory_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.product
    ADD CONSTRAINT product_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.program_announcement
    ADD CONSTRAINT program_announcement_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.program_approval
    ADD CONSTRAINT program_approval_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.program_category
    ADD CONSTRAINT program_category_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.program_content_audio
    ADD CONSTRAINT program_content_audio_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.program_content_body
    ADD CONSTRAINT program_content_body_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.program_content_log
    ADD CONSTRAINT program_content_log_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.program_content_material
    ADD CONSTRAINT program_content_material_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.program_content_plan
    ADD CONSTRAINT program_content_permission_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.program_content
    ADD CONSTRAINT program_content_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.program_content_progress
    ADD CONSTRAINT program_content_progress_member_id_program_content_id_key UNIQUE (member_id, program_content_id);
ALTER TABLE ONLY public.program_content_progress
    ADD CONSTRAINT program_content_progress_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.program_content_section
    ADD CONSTRAINT program_content_section_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.program_content_video
    ADD CONSTRAINT program_content_stream_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.program_package_category
    ADD CONSTRAINT program_package_category_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.program_package
    ADD CONSTRAINT program_package_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.program_package_plan
    ADD CONSTRAINT program_package_plan_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.program_package_program
    ADD CONSTRAINT program_package_program_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.program_package_program
    ADD CONSTRAINT program_package_program_program_package_id_program_id_key UNIQUE (program_package_id, program_id);
ALTER TABLE ONLY public.program_package_tag
    ADD CONSTRAINT program_package_tag_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.program_package_tag
    ADD CONSTRAINT program_package_tag_program_package_id_tag_name_key UNIQUE (program_package_id, tag_name);
ALTER TABLE ONLY public.program
    ADD CONSTRAINT program_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.program_plan
    ADD CONSTRAINT program_plan_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.program_related_item
    ADD CONSTRAINT program_related_item_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.program_role
    ADD CONSTRAINT program_role_name_program_id_member_id_key UNIQUE (name, program_id, member_id);
ALTER TABLE ONLY public.program_role
    ADD CONSTRAINT program_role_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.program_tag
    ADD CONSTRAINT program_tag_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.program_tag
    ADD CONSTRAINT program_tag_program_id_tag_name_key UNIQUE (program_id, tag_name);
ALTER TABLE ONLY public.program_tempo_delivery
    ADD CONSTRAINT program_tempo_delivery_member_id_program_package_program_id_key UNIQUE (member_id, program_package_program_id);
ALTER TABLE ONLY public.program_tempo_delivery
    ADD CONSTRAINT program_tempo_delivery_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.program_timetable
    ADD CONSTRAINT program_timetable_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.project_category
    ADD CONSTRAINT project_category_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.project
    ADD CONSTRAINT project_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.project_plan
    ADD CONSTRAINT project_plan_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.project_plan_product
    ADD CONSTRAINT project_plan_product_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.project_plan_product
    ADD CONSTRAINT project_plan_product_project_plan_id_product_id_key UNIQUE (project_plan_id, product_id);
ALTER TABLE ONLY public.project_reaction
    ADD CONSTRAINT project_reaction_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.project_role
    ADD CONSTRAINT project_role_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.project_section
    ADD CONSTRAINT project_section_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.project_tag
    ADD CONSTRAINT project_tag_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.project_tag
    ADD CONSTRAINT project_tag_project_id_tag_name_key UNIQUE (project_id, tag_name);
ALTER TABLE ONLY public.property
    ADD CONSTRAINT property_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.question_group
    ADD CONSTRAINT question_group_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.question_library
    ADD CONSTRAINT question_library_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.question_option
    ADD CONSTRAINT question_option_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.question
    ADD CONSTRAINT question_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.review
    ADD CONSTRAINT review_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.review_reaction
    ADD CONSTRAINT review_reaction_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.review_reaction
    ADD CONSTRAINT review_reaction_review_id_member_id_key UNIQUE (review_id, member_id);
ALTER TABLE ONLY public.review_reply
    ADD CONSTRAINT review_reply_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.role_permission
    ADD CONSTRAINT role_permission_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.role_permission
    ADD CONSTRAINT role_permission_role_id_permission_id_key UNIQUE (role_id, permission_id);
ALTER TABLE ONLY public.role
    ADD CONSTRAINT role_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.search_tag
    ADD CONSTRAINT search_tag_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.search_tag
    ADD CONSTRAINT search_tag_tag_name_app_id_key UNIQUE (tag_name, app_id);
ALTER TABLE ONLY public.service
    ADD CONSTRAINT service_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.setting
    ADD CONSTRAINT setting_pkey PRIMARY KEY (key);
ALTER TABLE ONLY public.sharing_code
    ADD CONSTRAINT sharing_code_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.signup_property
    ADD CONSTRAINT signup_property_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.sms_verification_code
    ADD CONSTRAINT sms_verification_code_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.social_card
    ADD CONSTRAINT social_card_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.social_card_subscriber
    ADD CONSTRAINT social_card_subscriber_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.table_log
    ADD CONSTRAINT table_log_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.tag
    ADD CONSTRAINT tag_id_key UNIQUE (name);
ALTER TABLE ONLY public.tag
    ADD CONSTRAINT tag_pkey PRIMARY KEY (name);
ALTER TABLE ONLY public.token
    ADD CONSTRAINT token_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.user_oauth
    ADD CONSTRAINT user_oauth_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.user_oauth
    ADD CONSTRAINT user_oauth_user_id_provider_key UNIQUE (user_id, provider);
ALTER TABLE ONLY public.user_permission
    ADD CONSTRAINT user_permission_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_refresh_token_key UNIQUE (refresh_token);
ALTER TABLE ONLY public.venue
    ADD CONSTRAINT venue_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.venue_seat
    ADD CONSTRAINT venue_seat_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.voucher_category
    ADD CONSTRAINT voucher_category_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.voucher_code
    ADD CONSTRAINT voucher_code_code_key UNIQUE (code);
ALTER TABLE ONLY public.voucher_code
    ADD CONSTRAINT voucher_code_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.voucher
    ADD CONSTRAINT voucher_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.voucher_plan_category
    ADD CONSTRAINT voucher_plan_category_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.voucher_plan
    ADD CONSTRAINT voucher_plan_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.voucher_plan_product
    ADD CONSTRAINT voucher_plan_product_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.voucher
    ADD CONSTRAINT voucher_voucher_code_id_member_id_key UNIQUE (voucher_code_id, member_id);
ALTER TABLE ONLY public.webhook_log
    ADD CONSTRAINT webhook_log_pkey PRIMARY KEY (id);
CREATE INDEX member_app_id ON public.member USING btree (app_id);
CREATE INDEX member_contract_agreed_at ON public.member_contract USING btree (agreed_at);
CREATE INDEX member_contract_agreed_at_revoked_at_idx ON public.member_contract USING btree (agreed_at, revoked_at) WHERE ((agreed_at IS NOT NULL) AND (revoked_at IS NULL));
CREATE INDEX member_contract_revoked_at ON public.member_contract USING btree (revoked_at);
CREATE INDEX member_created_at_brin_index ON public.member USING brin (created_at);
CREATE INDEX member_created_at_desc_null_last_index ON public.member USING btree (created_at DESC NULLS LAST);
CREATE INDEX member_note_author_id ON public.member_note USING btree (author_id);
CREATE INDEX member_note_created_at_asc ON public.member_note USING btree (created_at);
CREATE INDEX member_note_created_at_desc ON public.member_note USING btree (created_at DESC);
CREATE INDEX member_note_rejected_at ON public.member_note USING btree (rejected_at);
CREATE INDEX member_note_status ON public.member_note USING btree (status);
CREATE INDEX member_note_type ON public.member_note USING btree (type);
CREATE INDEX member_note_type_outbound ON public.member_note USING btree (type) WHERE (type = 'outbound'::text);
CREATE INDEX notification_updated_at_desc ON public.notification USING btree (updated_at DESC);
CREATE INDEX notification_updated_at_desc_nulls_first_index ON public.notification USING btree (updated_at DESC);
CREATE INDEX order_log_member_id ON public.order_log USING btree (member_id);
CREATE INDEX order_log_started_at_desc ON public.order_log USING btree (created_at DESC);
CREATE INDEX order_log_status ON public.order_log USING btree (status);
CREATE INDEX order_product_ended_at_desc ON public.order_product USING btree (ended_at DESC);
CREATE INDEX order_product_order_id ON public.order_product USING btree (order_id);
CREATE INDEX order_product_started_at_desc_nulls_first_index ON public.order_product USING btree (started_at DESC);
CREATE INDEX post_id_category_id_key ON public.post_category USING btree (post_id, category_id);
CREATE INDEX post_id_member_id_key ON public.post_role USING btree (post_id, member_id);
CREATE INDEX product_type ON public.product USING btree (type);
CREATE INDEX product_type_target ON public.product USING btree (type, target);
CREATE INDEX program_app_id ON public.program USING btree (app_id);
CREATE INDEX program_category_program_id ON public.program_category USING btree (program_id);
CREATE INDEX program_content_content_section_id ON public.program_content USING btree (content_section_id);
CREATE INDEX program_content_log_created_at ON public.program_content_log USING btree (created_at);
CREATE INDEX program_content_log_member_id ON public.program_content_log USING btree (member_id);
CREATE INDEX program_content_section_program_id ON public.program_content_section USING btree (program_id);
CREATE INDEX program_is_private ON public.program USING btree (is_private);
CREATE INDEX program_package_app_id ON public.program_package USING btree (app_id);
CREATE INDEX program_plan_program_id ON public.program_plan USING btree (program_id);
CREATE INDEX program_position_published_at_updated_at_index ON public.program USING btree ("position", published_at DESC, updated_at DESC);
CREATE INDEX program_role_program_id ON public.program_role USING btree (program_id);
CREATE INDEX program_updated_at_desc ON public.program USING btree (updated_at DESC);
CREATE OR REPLACE VIEW public.member_public AS
 WITH backstage_enter_member AS (
         SELECT member_permission.member_id
           FROM public.member_permission
          WHERE (member_permission.permission_id = 'BACKSTAGE_ENTER'::text)
        )
 SELECT member.id,
    member.name,
    member.username,
    member.roles_deprecated AS roles,
    member.picture_url,
    member.description,
    member.metadata,
    member.app_id,
    member.role,
    member.abstract,
    (COALESCE(json_agg(member_tag.tag_name) FILTER (WHERE (member_tag.tag_name IS NOT NULL)), '[]'::json))::jsonb AS tag_names,
    member.zoom_user_id_deprecate AS zoom_user_id,
    member.title,
    member.email,
    member.created_at,
    member.status,
        CASE
            WHEN (backstage_enter_member.member_id IS NOT NULL) THEN 1
            WHEN (backstage_enter_member.member_id IS NULL) THEN 0
            ELSE NULL::integer
        END AS has_backstage_enter_permission,
    member.manager_id
   FROM ((public.member
     LEFT JOIN public.member_tag ON ((member_tag.member_id = member.id)))
     LEFT JOIN backstage_enter_member ON ((backstage_enter_member.member_id = member.id)))
  GROUP BY member.id, member.name, member.username, member.roles_deprecated, member.picture_url, member.description, member.metadata, member.app_id, member.role, member.abstract, member.title, member.email, member.created_at, backstage_enter_member.member_id;
CREATE OR REPLACE VIEW public.order_executor_sharing AS
 SELECT order_executor.id AS order_executor_id,
    order_executor.member_id AS executor_id,
    order_executor.order_id,
    (COALESCE(order_product_price.price, (0)::numeric) - COALESCE(order_discount_price.price, (0)::numeric)) AS total_price,
    order_executor.ratio,
    order_log.created_at
   FROM (((public.order_executor
     JOIN public.order_log ON (((order_log.status = 'SUCCESS'::text) AND (order_log.id = order_executor.order_id))))
     LEFT JOIN ( SELECT order_product.order_id,
            sum(order_product.price) AS price
           FROM public.order_product
          GROUP BY order_product.order_id) order_product_price ON ((order_product_price.order_id = order_log.id)))
     LEFT JOIN ( SELECT order_discount.order_id,
            sum(order_discount.price) AS price
           FROM public.order_discount
          GROUP BY order_discount.order_id) order_discount_price ON ((order_discount_price.order_id = order_log.id)))
  GROUP BY order_executor.id, order_executor.member_id, order_executor.order_id, order_log.created_at, order_product_price.price, order_discount_price.price;
CREATE OR REPLACE VIEW public.sales_active_log AS
 SELECT (member_contract.id)::text AS id,
    'contract'::text AS event,
    t.member_id AS sales_id,
    member_contract.member_id,
    NULL::timestamp with time zone AS created_at,
    member_contract.agreed_at,
    member_contract.revoked_at,
    (((member_contract."values" -> 'price'::text))::numeric * (t.ratio)::numeric) AS price,
    NULL::timestamp without time zone AS due_at,
    NULL::text AS status,
    NULL::timestamp without time zone AS rejected_at,
    NULL::integer AS duration,
    NULL::bigint AS past_count,
    NULL::timestamp without time zone AS started_at,
    NULL::timestamp without time zone AS ended_at,
    NULL::text AS type
   FROM (public.member_contract
     CROSS JOIN LATERAL jsonb_to_recordset((member_contract."values" -> 'orderExecutors'::text)) t(ratio text, member_id text))
  WHERE (member_contract.agreed_at IS NOT NULL)
  GROUP BY member_contract.id, t.member_id, t.ratio
UNION ALL
 SELECT member_task.id,
    'task'::text AS event,
    member_task.executor_id AS sales_id,
    member_task.member_id,
    member_task.created_at,
    NULL::timestamp without time zone AS agreed_at,
    NULL::timestamp without time zone AS revoked_at,
    NULL::numeric AS price,
    member_task.due_at,
    member_task.status,
    NULL::timestamp without time zone AS rejected_at,
    NULL::integer AS duration,
    NULL::bigint AS past_count,
    NULL::timestamp without time zone AS started_at,
    NULL::timestamp without time zone AS ended_at,
    NULL::text AS type
   FROM (public.member_task
     JOIN public.category ON (((category.id = member_task.category_id) AND (category.name = '預約DEMO'::text))))
  WHERE (member_task.due_at IS NOT NULL)
  GROUP BY member_task.id
UNION ALL
 SELECT member_note.id,
    'note'::text AS event,
    member_note.author_id AS sales_id,
    member_note.member_id,
    member_note.created_at,
    NULL::timestamp without time zone AS agreed_at,
    NULL::timestamp without time zone AS revoked_at,
    NULL::numeric AS price,
    NULL::timestamp without time zone AS due_at,
    member_note.status,
    member_note.rejected_at,
    member_note.duration,
    count(mn.id) AS past_count,
    NULL::timestamp without time zone AS started_at,
    NULL::timestamp without time zone AS ended_at,
    member_note.type
   FROM (public.member_note
     LEFT JOIN public.member_note mn ON (((mn.member_id = member_note.member_id) AND (mn.created_at < member_note.created_at))))
  GROUP BY member_note.id
UNION ALL
 SELECT (attend.id)::text AS id,
    'attend'::text AS event,
    attend.member_id AS sales_id,
    NULL::text AS member_id,
    NULL::timestamp without time zone AS created_at,
    NULL::timestamp without time zone AS agreed_at,
    NULL::timestamp without time zone AS revoked_at,
    NULL::numeric AS price,
    NULL::timestamp without time zone AS due_at,
    NULL::text AS status,
    NULL::timestamp without time zone AS rejected_at,
    NULL::integer AS duration,
    NULL::bigint AS past_count,
    attend.started_at,
    attend.ended_at,
    NULL::text AS type
   FROM public.attend
  WHERE (attend.ended_at IS NOT NULL);
CREATE OR REPLACE VIEW public.activity_ticket_enrollment_count AS
 SELECT activity_ticket.id AS activity_ticket_id,
    activity_ticket.activity_id,
    activity_ticket.count,
        CASE
            WHEN (count(order_product.id) = 0) THEN (0)::bigint
            ELSE sum(COALESCE(((order_product.options -> 'quantity'::text))::integer, 1))
        END AS enrollment_count,
    (activity_ticket.count -
        CASE
            WHEN (count(order_product.id) = 0) THEN (0)::bigint
            ELSE sum(COALESCE(((order_product.options -> 'quantity'::text))::integer, 1))
        END) AS buyable_quantity
   FROM (public.activity_ticket
     FULL JOIN ( SELECT order_product_1.id,
            order_product_1.product_id,
            order_product_1.options
           FROM (public.order_product order_product_1
             JOIN public.order_log ON (((order_log.id = order_product_1.order_id) AND (order_product_1.delivered_at < now()) AND (order_log.parent_order_id IS NULL))))) order_product ON ((order_product.product_id = concat('ActivityTicket_', activity_ticket.id))))
  WHERE (activity_ticket.id IS NOT NULL)
  GROUP BY activity_ticket.id, activity_ticket.activity_id;
CREATE OR REPLACE VIEW public.member_order_status AS
 WITH member_coupon AS (
         SELECT c.member_id,
            cp.title AS coupon_plan_title,
            count(c.id) AS coupon_count
           FROM (((public.coupon c
             JOIN public.coupon_status cs ON (((c.id = cs.coupon_id) AND (cs.outdated = false) AND (cs.used = false))))
             JOIN public.coupon_code cc ON ((cc.id = c.coupon_code_id)))
             JOIN public.coupon_plan cp ON ((cp.id = cc.coupon_plan_id)))
          GROUP BY c.member_id, cp.title
        ), member_coin AS (
         SELECT m.id AS member_id,
            m.name AS member_name,
            m.username,
            m.email,
            m.picture_url,
            sum(cs.remaining) AS coin_remaining
           FROM (public.member m
             LEFT JOIN public.coin_status cs ON ((cs.member_id = m.id)))
          GROUP BY m.id
        ), custom_member_note AS (
         SELECT tmp.member_note_id,
            tmp.member_id,
            tmp.created_at,
            tmp.author_id,
            tmp.author_name,
            tmp.author_email,
            tmp.row_number
           FROM ( SELECT mn.id AS member_note_id,
                    mn.member_id,
                    mn.created_at,
                    m.id AS author_id,
                    m.name AS author_name,
                    m.email AS author_email,
                    row_number() OVER (PARTITION BY mn.member_id ORDER BY mn.created_at DESC) AS row_number
                   FROM (public.member_note mn
                     JOIN public.member m ON ((m.id = mn.author_id)))) tmp
          WHERE (tmp.row_number = 1)
        ), member_info AS (
         SELECT mcoin.member_id,
            mcoin.member_name,
            mcoin.username,
            mcoin.email,
            mcoin.picture_url,
            mcoin.coin_remaining,
            mcp.coupon_count,
            mcp.coupon_plan_title,
            cmn.member_note_id,
            cmn.created_at AS member_note_created_at,
            cmn.author_id,
            cmn.author_name,
            cmn.author_email
           FROM ((member_coin mcoin
             LEFT JOIN member_coupon mcp ON ((mcp.member_id = mcoin.member_id)))
             LEFT JOIN custom_member_note cmn ON ((cmn.member_id = mcoin.member_id)))
        ), order_product_info AS (
         SELECT ol.id AS order_id,
            op.product_id,
            op.id AS order_product_id,
            ol.member_id,
            op.delivered_at AS order_product_delivered_at,
            op.ended_at AS order_product_ended_at
           FROM (public.order_product op
             JOIN public.order_log ol ON ((ol.id = op.order_id)))
        )
 SELECT opi.order_id,
    opi.product_id,
    opi.order_product_id,
    opi.member_id,
    opi.order_product_delivered_at,
    opi.order_product_ended_at,
    mi.member_name,
    mi.username AS member_username,
    mi.email AS member_email,
    mi.picture_url AS member_picture_url,
    mi.coin_remaining,
    mi.coupon_count,
    mi.coupon_plan_title,
    mi.member_note_id,
    mi.member_note_created_at,
    mi.author_id,
    mi.author_name,
    mi.author_email
   FROM (order_product_info opi
     JOIN member_info mi ON ((mi.member_id = opi.member_id)))
  ORDER BY opi.order_product_ended_at;
CREATE OR REPLACE VIEW public.coin_usage_export AS
 SELECT m.app_id,
    mc.id AS member_contract_id,
    o.invoice_issued_at,
    (o.invoice_options ->> 'invoiceNumber'::text) AS invoice_number,
    m.id AS member_id,
    m.email,
    m.name,
    mc.agreed_at,
    ((mc."values" ->> 'price'::text))::numeric AS price,
    ((mc."values" ->> 'coinLogs'::text))::jsonb AS coin_logs,
    to_jsonb(array_agg(od.*)) AS discount_log
   FROM (((public.member_contract mc
     JOIN public.member_public m ON ((m.id = mc.member_id)))
     LEFT JOIN ( SELECT cl.member_id,
            od2.id AS order_discount_id,
            od2.order_id,
            od2.name,
            od2.description,
            od2.price,
            od2.type,
            od2.target,
            od2.options,
            o2.created_at,
            o2.status
           FROM ((public.coin_log cl
             JOIN public.order_discount od2 ON ((od2.target = (cl.id)::text)))
             JOIN public.order_log o2 ON ((o2.id = od2.order_id)))
          WHERE (o2.status = 'SUCCESS'::text)) od ON ((od.member_id = m.id)))
     JOIN public.order_log o ON ((o.id = (mc."values" ->> 'orderId'::text))))
  WHERE (mc.revoked_at IS NULL)
  GROUP BY m.app_id, mc.id, o.invoice_issued_at, o.invoice_options, m.id, m.email, m.name
  ORDER BY mc.agreed_at DESC;
CREATE TRIGGER app_setting_audit_delete AFTER DELETE ON public.app_setting FOR EACH ROW EXECUTE PROCEDURE public.func_table_log('app_setting');
CREATE TRIGGER app_setting_audit_insert AFTER INSERT ON public.app_setting FOR EACH ROW EXECUTE PROCEDURE public.func_table_log('app_setting');
CREATE TRIGGER app_setting_audit_update AFTER UPDATE ON public.app_setting FOR EACH ROW EXECUTE PROCEDURE public.func_table_log('app_setting');
CREATE TRIGGER member_audit_delete AFTER DELETE ON public.member FOR EACH ROW EXECUTE PROCEDURE public.func_table_log('member');
CREATE TRIGGER member_audit_insert AFTER INSERT ON public.member FOR EACH ROW EXECUTE PROCEDURE public.func_table_log('member');
CREATE TRIGGER member_audit_update AFTER UPDATE ON public.member FOR EACH ROW EXECUTE PROCEDURE public.func_table_log('member');
CREATE TRIGGER member_property_audit_delete AFTER DELETE ON public.member_property FOR EACH ROW EXECUTE PROCEDURE public.func_table_log('member_property');
CREATE TRIGGER member_property_audit_insert AFTER INSERT ON public.member_property FOR EACH ROW EXECUTE PROCEDURE public.func_table_log('member_property');
CREATE TRIGGER member_property_audit_update AFTER UPDATE ON public.member_property FOR EACH ROW EXECUTE PROCEDURE public.func_table_log('member_property');
CREATE TRIGGER order_log_audit_delete AFTER DELETE ON public.order_log FOR EACH ROW EXECUTE PROCEDURE public.func_table_log('order_log');
CREATE TRIGGER order_log_audit_insert AFTER INSERT ON public.order_log FOR EACH ROW EXECUTE PROCEDURE public.func_table_log('order_log');
CREATE TRIGGER order_log_audit_update AFTER UPDATE ON public.order_log FOR EACH ROW EXECUTE PROCEDURE public.func_table_log('order_log');
CREATE TRIGGER order_product_audit_insert AFTER INSERT ON public.order_product FOR EACH ROW EXECUTE PROCEDURE public.func_table_log('order_product');
CREATE TRIGGER order_product_audit_update AFTER UPDATE ON public.order_product FOR EACH ROW EXECUTE PROCEDURE public.func_table_log('order_product');
CREATE TRIGGER payment_log_audit_delete AFTER DELETE ON public.payment_log FOR EACH ROW EXECUTE PROCEDURE public.func_table_log('payment_log');
CREATE TRIGGER payment_log_audit_insert AFTER INSERT ON public.payment_log FOR EACH ROW EXECUTE PROCEDURE public.func_table_log('payment_log');
CREATE TRIGGER payment_log_audit_update AFTER UPDATE ON public.payment_log FOR EACH ROW EXECUTE PROCEDURE public.func_table_log('payment_log');
CREATE TRIGGER set_activity_ticket_product AFTER INSERT ON public.activity_ticket FOR EACH ROW EXECUTE PROCEDURE public.insert_product('ActivityTicket');
CREATE TRIGGER set_appointment_plan_product AFTER INSERT ON public.appointment_plan FOR EACH ROW EXECUTE PROCEDURE public.insert_product('AppointmentPlan');
CREATE TRIGGER set_card_product AFTER INSERT ON public.card FOR EACH ROW EXECUTE PROCEDURE public.insert_product('Card');
CREATE TRIGGER set_estimator_product AFTER INSERT ON public.estimator FOR EACH ROW EXECUTE PROCEDURE public.insert_product('Estimator');
CREATE TRIGGER set_member_manager_updated_audit_log AFTER INSERT ON public.member FOR EACH ROW EXECUTE PROCEDURE public.set_member_manager_updated_audit_log();
CREATE TRIGGER set_merchandise_product AFTER INSERT ON public.merchandise FOR EACH ROW EXECUTE PROCEDURE public.insert_product('Merchandise');
CREATE TRIGGER set_merchandise_spec_product AFTER INSERT ON public.merchandise_spec FOR EACH ROW EXECUTE PROCEDURE public.insert_product('MerchandiseSpec');
CREATE TRIGGER set_podcast_album_product AFTER INSERT ON public.podcast_album FOR EACH ROW EXECUTE PROCEDURE public.insert_product('PodcastAlbum');
CREATE TRIGGER set_podcast_plan_product AFTER INSERT ON public.podcast_plan FOR EACH ROW EXECUTE PROCEDURE public.insert_product('PodcastPlan');
CREATE TRIGGER set_podcast_program_product AFTER INSERT ON public.podcast_program FOR EACH ROW EXECUTE PROCEDURE public.insert_product('PodcastProgram');
CREATE TRIGGER set_program_package_plan_product AFTER INSERT ON public.program_package_plan FOR EACH ROW EXECUTE PROCEDURE public.insert_product('ProgramPackagePlan');
CREATE TRIGGER set_program_plan_product AFTER INSERT ON public.program_plan FOR EACH ROW EXECUTE PROCEDURE public.insert_product('ProgramPlan');
CREATE TRIGGER set_program_product AFTER INSERT ON public.program FOR EACH ROW EXECUTE PROCEDURE public.insert_product('Program');
CREATE TRIGGER set_project_plan_product AFTER INSERT ON public.project_plan FOR EACH ROW EXECUTE PROCEDURE public.insert_product('ProjectPlan');
CREATE TRIGGER set_public_achievement_template_updated_at BEFORE UPDATE ON public.achievement_template FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_achievement_template_updated_at ON public.achievement_template IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_activity_updated_at BEFORE UPDATE ON public.activity FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_activity_updated_at ON public.activity IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_app_achievement_updated_at BEFORE UPDATE ON public.app_achievement FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_app_achievement_updated_at ON public.app_achievement IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_app_extended_module_updated_at BEFORE UPDATE ON public.app_extended_module FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_app_extended_module_updated_at ON public.app_extended_module IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_app_page_template_updated_at BEFORE UPDATE ON public.app_page_template FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_app_page_template_updated_at ON public.app_page_template IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_app_page_updated_at BEFORE UPDATE ON public.app_page FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_app_page_updated_at ON public.app_page IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_app_plan_module_updated_at BEFORE UPDATE ON public.app_plan_module FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_app_plan_module_updated_at ON public.app_plan_module IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_app_plan_updated_at BEFORE UPDATE ON public.app_plan FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_app_plan_updated_at ON public.app_plan IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_app_updated_at BEFORE UPDATE ON public.app FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_app_updated_at ON public.app IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_appointment_plan_updated_at BEFORE UPDATE ON public.appointment_plan FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_appointment_plan_updated_at ON public.appointment_plan IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_appointment_schedule_updated_at BEFORE UPDATE ON public.appointment_schedule FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_appointment_schedule_updated_at ON public.appointment_schedule IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_attend_updated_at BEFORE UPDATE ON public.attend FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_attend_updated_at ON public.attend IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_category_updated_at BEFORE UPDATE ON public.category FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_category_updated_at ON public.category IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_certificate_template_updated_at BEFORE UPDATE ON public.certificate_template FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_certificate_template_updated_at ON public.certificate_template IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_certificate_updated_at BEFORE UPDATE ON public.certificate FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_certificate_updated_at ON public.certificate IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_contract_updated_at BEFORE UPDATE ON public.contract FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_contract_updated_at ON public.contract IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_coupon_code_updated_at BEFORE UPDATE ON public.coupon_code FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_coupon_code_updated_at ON public.coupon_code IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_coupon_plan_updated_at BEFORE UPDATE ON public.coupon_plan FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_coupon_plan_updated_at ON public.coupon_plan IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_creator_display_updated_at BEFORE UPDATE ON public.creator_display FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_creator_display_updated_at ON public.creator_display IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_email_template_updated_at BEFORE UPDATE ON public.email_template FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_email_template_updated_at ON public.email_template IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_estimator_updated_at BEFORE UPDATE ON public.estimator FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_estimator_updated_at ON public.estimator IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_exam_member_time_limit_updated_at BEFORE UPDATE ON public.exam_member_time_limit FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_exam_member_time_limit_updated_at ON public.exam_member_time_limit IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_exam_question_group_updated_at BEFORE UPDATE ON public.exam_question_group FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_exam_question_group_updated_at ON public.exam_question_group IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_exam_updated_at BEFORE UPDATE ON public.exam FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_exam_updated_at ON public.exam IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_exercise_updated_at BEFORE UPDATE ON public.exercise FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_exercise_updated_at ON public.exercise IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_file_updated_at BEFORE UPDATE ON public.file FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_file_updated_at ON public.file IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_gift_plan_updated_at BEFORE UPDATE ON public.gift_plan FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_gift_plan_updated_at ON public.gift_plan IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_invoice_updated_at BEFORE UPDATE ON public.invoice FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_invoice_updated_at ON public.invoice IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_meet_updated_at BEFORE UPDATE ON public.meet FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_meet_updated_at ON public.meet IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_member_achievement_updated_at BEFORE UPDATE ON public.member_achievement FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_member_achievement_updated_at ON public.member_achievement IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_member_contract_updated_at BEFORE UPDATE ON public.member_contract FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_member_contract_updated_at ON public.member_contract IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_member_device_updated_at BEFORE UPDATE ON public.member_device FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_member_device_updated_at ON public.member_device IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_member_learned_log_updated_at BEFORE UPDATE ON public.member_learned_log FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_member_learned_log_updated_at ON public.member_learned_log IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_member_note_updated_at BEFORE UPDATE ON public.member_note FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_member_note_updated_at ON public.member_note IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_member_permission_group_updated_at BEFORE UPDATE ON public.member_permission_group FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_member_permission_group_updated_at ON public.member_permission_group IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_member_permission_updated_at BEFORE UPDATE ON public.member_permission_extra FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_member_permission_updated_at ON public.member_permission_extra IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_member_phone_updated_at BEFORE UPDATE ON public.member_phone FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_member_phone_updated_at ON public.member_phone IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_member_property_updated_at BEFORE UPDATE ON public.member_property FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_member_property_updated_at ON public.member_property IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_member_shop_updated_at BEFORE UPDATE ON public.member_shop FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_member_shop_updated_at ON public.member_shop IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_member_speciality_updated_at BEFORE UPDATE ON public.member_speciality FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_member_speciality_updated_at ON public.member_speciality IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_member_tag_updated_at BEFORE UPDATE ON public.member_tag FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_member_tag_updated_at ON public.member_tag IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_member_task_updated_at BEFORE UPDATE ON public.member_task FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_member_task_updated_at ON public.member_task IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_merchandise_file_updated_at BEFORE UPDATE ON public.merchandise_file FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_merchandise_file_updated_at ON public.merchandise_file IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_merchandise_spec_file_updated_at BEFORE UPDATE ON public.merchandise_spec_file FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_merchandise_spec_file_updated_at ON public.merchandise_spec_file IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_merchandise_spec_updated_at BEFORE UPDATE ON public.merchandise_spec FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_merchandise_spec_updated_at ON public.merchandise_spec IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_merchandise_updated_at BEFORE UPDATE ON public.merchandise FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_merchandise_updated_at ON public.merchandise IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_order_contact_updated_at BEFORE UPDATE ON public.order_contact FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_order_contact_updated_at ON public.order_contact IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_order_log_updated_at BEFORE UPDATE ON public.order_log FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
CREATE TRIGGER set_public_order_product_updated_at BEFORE UPDATE ON public.order_product FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_order_product_updated_at ON public.order_product IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_organization_updated_at BEFORE UPDATE ON public.org FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_organization_updated_at ON public.org IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_payment_log_updated_at BEFORE UPDATE ON public.payment_log FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
CREATE TRIGGER set_public_permission_group_permission_updated_at BEFORE UPDATE ON public.permission_group_permission FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_permission_group_permission_updated_at ON public.permission_group_permission IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_permission_group_updated_at BEFORE UPDATE ON public.permission_group FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_permission_group_updated_at ON public.permission_group IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_permission_updated_at BEFORE UPDATE ON public.permission FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_permission_updated_at ON public.permission IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_playlist_podcast_program_updated_at BEFORE UPDATE ON public.playlist_podcast_program FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_playlist_podcast_program_updated_at ON public.playlist_podcast_program IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_playlist_updated_at BEFORE UPDATE ON public.playlist FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_playlist_updated_at ON public.playlist IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_podcast_album_updated_at BEFORE UPDATE ON public.podcast_album FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_podcast_album_updated_at ON public.podcast_album IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_podcast_plan_updated_at BEFORE UPDATE ON public.podcast_plan FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_podcast_plan_updated_at ON public.podcast_plan IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_podcast_program_audio_updated_at BEFORE UPDATE ON public.podcast_program_audio FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_podcast_program_audio_updated_at ON public.podcast_program_audio IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_podcast_program_progress_updated_at BEFORE UPDATE ON public.podcast_program_progress FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_podcast_program_progress_updated_at ON public.podcast_program_progress IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_podcast_program_updated_at BEFORE UPDATE ON public.podcast_program FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
CREATE TRIGGER set_public_post_updated_at BEFORE UPDATE ON public.post FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_post_updated_at ON public.post IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_practice_updated_at BEFORE UPDATE ON public.practice FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_practice_updated_at ON public.practice IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_product_gift_plan_updated_at BEFORE UPDATE ON public.product_gift_plan FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_product_gift_plan_updated_at ON public.product_gift_plan IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_product_updated_at BEFORE UPDATE ON public.product FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_product_updated_at ON public.product IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_program_approval_updated_at BEFORE UPDATE ON public.program_approval FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_program_approval_updated_at ON public.program_approval IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_program_content_audio_updated_at BEFORE UPDATE ON public.program_content_audio FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_program_content_audio_updated_at ON public.program_content_audio IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_program_content_material_updated_at BEFORE UPDATE ON public.program_content_material FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_program_content_material_updated_at ON public.program_content_material IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_program_content_progress_updated_at BEFORE UPDATE ON public.program_content_progress FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_program_content_progress_updated_at ON public.program_content_progress IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_program_content_stream_updated_at BEFORE UPDATE ON public.program_content_video FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_program_content_stream_updated_at ON public.program_content_video IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_program_timetable_updated_at BEFORE UPDATE ON public.program_timetable FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_program_timetable_updated_at ON public.program_timetable IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_program_updated_at BEFORE UPDATE ON public.program FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_program_updated_at ON public.program IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_project_role_updated_at BEFORE UPDATE ON public.project_role FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_project_role_updated_at ON public.project_role IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_property_updated_at BEFORE UPDATE ON public.property FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_property_updated_at ON public.property IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_question_group_updated_at BEFORE UPDATE ON public.question_group FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_question_group_updated_at ON public.question_group IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_question_library_updated_at BEFORE UPDATE ON public.question_library FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_question_library_updated_at ON public.question_library IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_question_option_updated_at BEFORE UPDATE ON public.question_option FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_question_option_updated_at ON public.question_option IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_question_updated_at BEFORE UPDATE ON public.question FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_question_updated_at ON public.question IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_review_reply_updated_at BEFORE UPDATE ON public.review_reply FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_review_reply_updated_at ON public.review_reply IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_review_updated_at BEFORE UPDATE ON public.review FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_review_updated_at ON public.review IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_role_permission_updated_at BEFORE UPDATE ON public.role_permission FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_role_permission_updated_at ON public.role_permission IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_role_updated_at BEFORE UPDATE ON public.role FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_role_updated_at ON public.role IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_search_tag_updated_at BEFORE UPDATE ON public.search_tag FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_search_tag_updated_at ON public.search_tag IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_service_updated_at BEFORE UPDATE ON public.service FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_service_updated_at ON public.service IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_sharing_code_updated_at BEFORE UPDATE ON public.sharing_code FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_sharing_code_updated_at ON public.sharing_code IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_signup_property_updated_at BEFORE UPDATE ON public.signup_property FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_signup_property_updated_at ON public.signup_property IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_tag_updated_at BEFORE UPDATE ON public.tag FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_tag_updated_at ON public.tag IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_token_updated_at BEFORE UPDATE ON public.token FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_token_updated_at ON public.token IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_user_permission_updated_at BEFORE UPDATE ON public.user_permission FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_user_permission_updated_at ON public.user_permission IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_user_updated_at BEFORE UPDATE ON public."user" FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_user_updated_at ON public."user" IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_venue_updated_at BEFORE UPDATE ON public.venue FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_venue_updated_at ON public.venue IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_voucher_plan_category_updated_at BEFORE UPDATE ON public.voucher_plan_category FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_voucher_plan_category_updated_at ON public.voucher_plan_category IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_voucher_plan_updated_at BEFORE UPDATE ON public.voucher_plan FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_voucher_plan_updated_at ON public.voucher_plan IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_token_product AFTER INSERT ON public.token FOR EACH ROW EXECUTE PROCEDURE public.insert_product('Token');
CREATE TRIGGER set_voucher_plan_product AFTER INSERT ON public.voucher_plan FOR EACH ROW EXECUTE PROCEDURE public.insert_product('VoucherPlan');
ALTER TABLE ONLY public.activity
    ADD CONSTRAINT activity_app_id_fkey FOREIGN KEY (app_id) REFERENCES public.app(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.activity_attendance
    ADD CONSTRAINT activity_attendance_activity_session_id_fkey FOREIGN KEY (activity_session_id) REFERENCES public.activity_session(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.activity_attendance
    ADD CONSTRAINT activity_attendance_order_product_id_fkey FOREIGN KEY (order_product_id) REFERENCES public.order_product(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.activity_category
    ADD CONSTRAINT activity_category_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.activity(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.activity_category
    ADD CONSTRAINT activity_category_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.category(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.activity
    ADD CONSTRAINT activity_member_id_fkey FOREIGN KEY (organizer_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.activity_session
    ADD CONSTRAINT activity_session_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.activity(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.activity_session_ticket
    ADD CONSTRAINT activity_session_ticket_activity_session_id_fkey FOREIGN KEY (activity_session_id) REFERENCES public.activity_session(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.activity_session_ticket
    ADD CONSTRAINT activity_session_ticket_activity_ticket_id_fkey FOREIGN KEY (activity_ticket_id) REFERENCES public.activity_ticket(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.activity_tag
    ADD CONSTRAINT activity_tag_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.activity(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.activity_tag
    ADD CONSTRAINT activity_tag_tag_name_fkey FOREIGN KEY (tag_name) REFERENCES public.tag(name) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.activity_ticket
    ADD CONSTRAINT activity_ticket_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.activity(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.app_admin
    ADD CONSTRAINT app_admin_app_id_fkey FOREIGN KEY (app_id) REFERENCES public.app(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.app
    ADD CONSTRAINT app_app_plan_id_fkey FOREIGN KEY (app_plan_id) REFERENCES public.app_plan(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.app_channel
    ADD CONSTRAINT app_channel_app_id_fkey FOREIGN KEY (app_id) REFERENCES public.app(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.app_default_permission
    ADD CONSTRAINT app_default_permission_app_id_fkey FOREIGN KEY (app_id) REFERENCES public.app(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.app_default_permission
    ADD CONSTRAINT app_default_permission_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permission(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.app_email_template
    ADD CONSTRAINT app_email_template_app_id_fkey FOREIGN KEY (app_id) REFERENCES public.app(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.app_email_template
    ADD CONSTRAINT app_email_template_email_template_id_fkey FOREIGN KEY (email_template_id) REFERENCES public.email_template(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.app_extended_module
    ADD CONSTRAINT app_extended_module_app_id_fkey FOREIGN KEY (app_id) REFERENCES public.app(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.app_extended_module
    ADD CONSTRAINT app_extended_module_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.module(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.app_host
    ADD CONSTRAINT app_host_app_id_fkey FOREIGN KEY (app_id) REFERENCES public.app(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.app_language
    ADD CONSTRAINT app_language_app_id_fkey FOREIGN KEY (app_id) REFERENCES public.app(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.app_nav
    ADD CONSTRAINT app_nav_app_id_fkey FOREIGN KEY (app_id) REFERENCES public.app(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.app_nav
    ADD CONSTRAINT app_nav_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.app_nav(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.app_page
    ADD CONSTRAINT app_page_author_id_fkey FOREIGN KEY (editor_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.app_page_section
    ADD CONSTRAINT app_page_section_app_page_id_fkey FOREIGN KEY (app_page_id) REFERENCES public.app_page(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.app_page_template
    ADD CONSTRAINT app_page_template_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.app_plan_module
    ADD CONSTRAINT app_plan_module_app_plan_id_fkey FOREIGN KEY (app_plan_id) REFERENCES public.app_plan(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.app_plan_module
    ADD CONSTRAINT app_plan_module_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.module(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.app_secret
    ADD CONSTRAINT app_secret_app_id_fkey FOREIGN KEY (app_id) REFERENCES public.app(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.app_secret
    ADD CONSTRAINT app_secret_key_fkey FOREIGN KEY (key) REFERENCES public.setting(key) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.app_setting
    ADD CONSTRAINT app_setting_app_id_fkey FOREIGN KEY (app_id) REFERENCES public.app(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.app_setting
    ADD CONSTRAINT app_setting_key_fkey FOREIGN KEY (key) REFERENCES public.setting(key) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.app_usage
    ADD CONSTRAINT app_usage_app_id_fkey FOREIGN KEY (app_id) REFERENCES public.app(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.app_webhook
    ADD CONSTRAINT app_webhook_app_id_fkey FOREIGN KEY (app_id) REFERENCES public.app(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.appointment_plan
    ADD CONSTRAINT appointment_plan_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.appointment_plan
    ADD CONSTRAINT appointment_plan_currency_id_fkey FOREIGN KEY (currency_id) REFERENCES public.currency(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.appointment_schedule
    ADD CONSTRAINT appointment_schedule_appointment_plan_id_fkey FOREIGN KEY (appointment_plan_id) REFERENCES public.appointment_plan(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.attachment
    ADD CONSTRAINT attachment_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.attachment
    ADD CONSTRAINT attachment_file_id_fkey FOREIGN KEY (file_id) REFERENCES public.file(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.attend
    ADD CONSTRAINT attend_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.bundle_item
    ADD CONSTRAINT bundle_item_bundle_id_fkey FOREIGN KEY (bundle_id) REFERENCES public.bundle(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.card
    ADD CONSTRAINT card_app_id_fkey FOREIGN KEY (app_id) REFERENCES public.app(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.card_discount
    ADD CONSTRAINT card_discount_card_id_fkey FOREIGN KEY (card_id) REFERENCES public.card(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.card_discount
    ADD CONSTRAINT card_discount_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.cart_item
    ADD CONSTRAINT cart_item_app_id_fkey FOREIGN KEY (app_id) REFERENCES public.app(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.cart_product
    ADD CONSTRAINT cart_product_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.coin_log
    ADD CONSTRAINT coin_log_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.comment
    ADD CONSTRAINT comment_app_id_fkey FOREIGN KEY (app_id) REFERENCES public.app(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.comment
    ADD CONSTRAINT comment_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.comment_reaction
    ADD CONSTRAINT comment_reaction_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.comment(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.comment_reaction
    ADD CONSTRAINT comment_reaction_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.comment_reply
    ADD CONSTRAINT comment_reply_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.comment(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.comment_reply
    ADD CONSTRAINT comment_reply_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.comment_reply_reaction
    ADD CONSTRAINT comment_reply_reaction_comment_reply_id_fkey FOREIGN KEY (comment_reply_id) REFERENCES public.comment_reply(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.comment_reply_reaction
    ADD CONSTRAINT comment_reply_reaction_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.coupon
    ADD CONSTRAINT coupon_coupon_code_id_fkey FOREIGN KEY (coupon_code_id) REFERENCES public.coupon_code(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.coupon
    ADD CONSTRAINT coupon_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.coupon_code
    ADD CONSTRAINT coupon_plan_code_coupon_plan_id_fkey FOREIGN KEY (coupon_plan_id) REFERENCES public.coupon_plan(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.coupon_plan_product
    ADD CONSTRAINT coupon_plan_product_coupon_plan_id_fkey FOREIGN KEY (coupon_plan_id) REFERENCES public.coupon_plan(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.coupon_plan_product
    ADD CONSTRAINT coupon_plan_product_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.creator_category
    ADD CONSTRAINT creator_category_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.category(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.creator_category
    ADD CONSTRAINT creator_category_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.creator_display
    ADD CONSTRAINT creator_display_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.exercise
    ADD CONSTRAINT exercise_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.exercise
    ADD CONSTRAINT exercise_program_content_id_fkey FOREIGN KEY (program_content_id) REFERENCES public.program_content(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.gift_plan_product
    ADD CONSTRAINT gift_plan_product_gift_plan_id_fkey FOREIGN KEY (gift_plan_id) REFERENCES public.gift_plan(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.gift_plan_product
    ADD CONSTRAINT gift_plan_product_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT invoice_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.order_log(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.issue
    ADD CONSTRAINT issue_app_id_fkey FOREIGN KEY (app_id) REFERENCES public.app(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.issue
    ADD CONSTRAINT issue_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.issue_reaction
    ADD CONSTRAINT issue_reaction_issue_id_fkey FOREIGN KEY (issue_id) REFERENCES public.issue(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.issue_reaction
    ADD CONSTRAINT issue_reaction_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.issue_reply
    ADD CONSTRAINT issue_reply_issue_id_fkey FOREIGN KEY (issue_id) REFERENCES public.issue(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.issue_reply
    ADD CONSTRAINT issue_reply_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.issue_reply_reaction
    ADD CONSTRAINT issue_reply_reaction_issue_reply_id_fkey FOREIGN KEY (issue_reply_id) REFERENCES public.issue_reply(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.issue_reply_reaction
    ADD CONSTRAINT issue_reply_reaction_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.media
    ADD CONSTRAINT media_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.member
    ADD CONSTRAINT member_app_id_fkey FOREIGN KEY (app_id) REFERENCES public.app(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.member_card
    ADD CONSTRAINT member_card_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.member_category
    ADD CONSTRAINT member_category_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.category(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.member_category
    ADD CONSTRAINT member_category_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.member_contract
    ADD CONSTRAINT member_contract_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.member_contract
    ADD CONSTRAINT member_contract_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contract(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.member_contract
    ADD CONSTRAINT member_contract_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.member_device
    ADD CONSTRAINT member_device_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.member
    ADD CONSTRAINT member_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.member_note
    ADD CONSTRAINT member_note_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.member_note
    ADD CONSTRAINT member_note_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.member_oauth
    ADD CONSTRAINT member_oauth_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.member_permission_group
    ADD CONSTRAINT member_permission_group_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.member_permission_group
    ADD CONSTRAINT member_permission_group_permission_group_id_fkey FOREIGN KEY (permission_group_id) REFERENCES public.permission_group(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.member_permission_extra
    ADD CONSTRAINT member_permission_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.member_permission_extra
    ADD CONSTRAINT member_permission_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permission(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.member_phone
    ADD CONSTRAINT member_phone_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.member_property
    ADD CONSTRAINT member_property_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.member_property
    ADD CONSTRAINT member_property_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.property(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.member_shop
    ADD CONSTRAINT member_shop_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.member_social
    ADD CONSTRAINT member_social_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.member_speciality
    ADD CONSTRAINT member_speciality_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.member_speciality
    ADD CONSTRAINT member_speciality_tag_name_fkey FOREIGN KEY (tag_name) REFERENCES public.tag(name) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.member_tag
    ADD CONSTRAINT member_tag_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.member_tag
    ADD CONSTRAINT member_tag_tag_fkey FOREIGN KEY (tag_name) REFERENCES public.tag(name) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.member_task
    ADD CONSTRAINT member_task_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.member_task
    ADD CONSTRAINT member_task_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.category(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.member_task
    ADD CONSTRAINT member_task_executor_id_fkey FOREIGN KEY (executor_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.member_task
    ADD CONSTRAINT member_task_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.member_tracking_log
    ADD CONSTRAINT member_tracking_log_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.merchandise
    ADD CONSTRAINT merchandise_app_id_fkey FOREIGN KEY (app_id) REFERENCES public.app(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.merchandise_category
    ADD CONSTRAINT merchandise_category_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.category(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.merchandise_category
    ADD CONSTRAINT merchandise_category_merchandise_id_fkey FOREIGN KEY (merchandise_id) REFERENCES public.merchandise(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.merchandise_file
    ADD CONSTRAINT merchandise_file_merchandise_id_fkey FOREIGN KEY (merchandise_id) REFERENCES public.merchandise(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.merchandise_img
    ADD CONSTRAINT merchandise_img_merchandise_id_fkey FOREIGN KEY (merchandise_id) REFERENCES public.merchandise(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.merchandise
    ADD CONSTRAINT merchandise_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.merchandise
    ADD CONSTRAINT merchandise_member_shop_id_fkey FOREIGN KEY (member_shop_id) REFERENCES public.member_shop(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.merchandise_spec_file
    ADD CONSTRAINT merchandise_spec_file_merchandise_spec_id_fkey FOREIGN KEY (merchandise_spec_id) REFERENCES public.merchandise_spec(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.merchandise_spec
    ADD CONSTRAINT merchandise_spec_merchandise_id_fkey FOREIGN KEY (merchandise_id) REFERENCES public.merchandise(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.merchandise_tag
    ADD CONSTRAINT merchandise_tag_merchandise_id_fkey FOREIGN KEY (merchandise_id) REFERENCES public.merchandise(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.merchandise_tag
    ADD CONSTRAINT merchandise_tag_tag_name_fkey FOREIGN KEY (tag_name) REFERENCES public.tag(name) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_source_member_id_fkey FOREIGN KEY (source_member_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_target_membere_id_fkey FOREIGN KEY (target_member_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.order_contact
    ADD CONSTRAINT order_contact_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.order_contact
    ADD CONSTRAINT order_contact_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.order_log(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.order_discount
    ADD CONSTRAINT order_discount_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.order_log(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.order_executor
    ADD CONSTRAINT order_executor_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.order_executor
    ADD CONSTRAINT order_executor_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.order_log(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.order_log
    ADD CONSTRAINT order_log_discount_coupon_id_fkey FOREIGN KEY (discount_coupon_id) REFERENCES public.coupon(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.order_log
    ADD CONSTRAINT order_log_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.order_log
    ADD CONSTRAINT order_log_parent_order_id_fkey FOREIGN KEY (parent_order_id) REFERENCES public.order_log(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.order_product
    ADD CONSTRAINT order_product_currency_id_fkey FOREIGN KEY (currency_id) REFERENCES public.currency(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.order_product_file
    ADD CONSTRAINT order_product_file_order_product_id_fkey FOREIGN KEY (order_product_id) REFERENCES public.order_product(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.order_product
    ADD CONSTRAINT order_product_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.order_log(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.order_product
    ADD CONSTRAINT order_product_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.package
    ADD CONSTRAINT package_app_id_fkey FOREIGN KEY (app_id) REFERENCES public.app(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.package_item
    ADD CONSTRAINT package_item_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.activity(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.package_item_group
    ADD CONSTRAINT package_item_group_package_section_id_fkey FOREIGN KEY (package_section_id) REFERENCES public.package_section(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.package_item
    ADD CONSTRAINT package_item_package_item_group_id_fkey FOREIGN KEY (package_item_group_id) REFERENCES public.package_item_group(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.package_item
    ADD CONSTRAINT package_item_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.program(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.package_section
    ADD CONSTRAINT package_section_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.package(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.payment_log
    ADD CONSTRAINT payment_log_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.order_log(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.permission_group_permission
    ADD CONSTRAINT permission_group_permission_permission_group_id_fkey FOREIGN KEY (permission_group_id) REFERENCES public.permission_group(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.permission_group_permission
    ADD CONSTRAINT permission_group_permission_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permission(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.playlist
    ADD CONSTRAINT playlist_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.playlist_podcast_program
    ADD CONSTRAINT playlist_podcast_program_playlist_id_fkey FOREIGN KEY (playlist_id) REFERENCES public.playlist(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.playlist_podcast_program
    ADD CONSTRAINT playlist_podcast_program_podcast_program_id_fkey FOREIGN KEY (podcast_program_id) REFERENCES public.podcast_program(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.podcast_album
    ADD CONSTRAINT podcast_album_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.podcast_album_category
    ADD CONSTRAINT podcast_album_category_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.category(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.podcast_album_category
    ADD CONSTRAINT podcast_album_category_podcast_album_id_fkey FOREIGN KEY (podcast_album_id) REFERENCES public.podcast_album(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.podcast_album_podcast_program
    ADD CONSTRAINT podcast_album_podcast_program_podcast_album_id_fkey FOREIGN KEY (podcast_album_id) REFERENCES public.podcast_album(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.podcast_album_podcast_program
    ADD CONSTRAINT podcast_album_podcast_program_podcast_program_id_fkey FOREIGN KEY (podcast_program_id) REFERENCES public.podcast_program(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.podcast
    ADD CONSTRAINT podcast_app_id_fkey FOREIGN KEY (app_id) REFERENCES public.app(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.podcast
    ADD CONSTRAINT podcast_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.podcast_plan
    ADD CONSTRAINT podcast_plan_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.podcast_plan
    ADD CONSTRAINT podcast_plan_podcast_id_fkey FOREIGN KEY (podcast_id) REFERENCES public.podcast(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.podcast_program_audio
    ADD CONSTRAINT podcast_program_audio_podcast_program_id_fkey FOREIGN KEY (podcast_program_id) REFERENCES public.podcast_program(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.podcast_program_body
    ADD CONSTRAINT podcast_program_body_podcast_program_id_fkey FOREIGN KEY (podcast_program_id) REFERENCES public.podcast_program(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.podcast_program_category
    ADD CONSTRAINT podcast_program_category_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.category(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.podcast_program_category
    ADD CONSTRAINT podcast_program_category_podcast_program_id_fkey FOREIGN KEY (podcast_program_id) REFERENCES public.podcast_program(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.podcast_program
    ADD CONSTRAINT podcast_program_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.podcast_program
    ADD CONSTRAINT podcast_program_podcast_id_fkey FOREIGN KEY (podcast_id) REFERENCES public.podcast(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.podcast_program_progress
    ADD CONSTRAINT podcast_program_progress_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.podcast_program_progress
    ADD CONSTRAINT podcast_program_progress_podcast_album_id_fkey FOREIGN KEY (podcast_album_id) REFERENCES public.podcast_album(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.podcast_program_progress
    ADD CONSTRAINT podcast_program_progress_podcast_program_id_fkey FOREIGN KEY (podcast_program_id) REFERENCES public.podcast_program(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.podcast_program_role
    ADD CONSTRAINT podcast_program_role_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.podcast_program_role
    ADD CONSTRAINT podcast_program_role_podcast_program_id_fkey FOREIGN KEY (podcast_program_id) REFERENCES public.podcast_program(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.podcast_program_tag
    ADD CONSTRAINT podcast_program_tag_podcast_program_id_fkey FOREIGN KEY (podcast_program_id) REFERENCES public.podcast_program(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.podcast_program_tag
    ADD CONSTRAINT podcast_program_tag_tag_name_fkey FOREIGN KEY (tag_name) REFERENCES public.tag(name) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.point_log
    ADD CONSTRAINT point_log_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.post
    ADD CONSTRAINT post_app_id_fkey FOREIGN KEY (app_id) REFERENCES public.app(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.post_category
    ADD CONSTRAINT post_category_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.category(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.post_category
    ADD CONSTRAINT post_category_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.post(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.post_merchandise
    ADD CONSTRAINT post_merchandise_merchandise_id_fkey FOREIGN KEY (merchandise_id) REFERENCES public.merchandise(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.post_merchandise
    ADD CONSTRAINT post_merchandise_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.post(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.post_role
    ADD CONSTRAINT post_role_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.post_role
    ADD CONSTRAINT post_role_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.post(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.post_tag
    ADD CONSTRAINT post_tag_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.post(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.post_tag
    ADD CONSTRAINT post_tag_tag_name_fkey FOREIGN KEY (tag_name) REFERENCES public.tag(name) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.practice
    ADD CONSTRAINT practice_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.practice
    ADD CONSTRAINT practice_program_content_id_fkey FOREIGN KEY (program_content_id) REFERENCES public.program_content(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.product_channel
    ADD CONSTRAINT product_channel_app_id_fkey FOREIGN KEY (app_id) REFERENCES public.app(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.product_channel
    ADD CONSTRAINT product_channel_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.app_channel(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.product_channel
    ADD CONSTRAINT product_channel_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.product_gift_plan
    ADD CONSTRAINT product_gift_plan_gift_plan_id_fkey FOREIGN KEY (gift_plan_id) REFERENCES public.gift_plan(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.product_inventory
    ADD CONSTRAINT product_inventory_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.program_announcement
    ADD CONSTRAINT program_announcement_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.program(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.program
    ADD CONSTRAINT program_app_id_fkey FOREIGN KEY (app_id) REFERENCES public.app(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.program_approval
    ADD CONSTRAINT program_approval_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.program(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.program_category
    ADD CONSTRAINT program_category_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.category(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.program_category
    ADD CONSTRAINT program_category_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.program(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.program_content_audio
    ADD CONSTRAINT program_content_audio_program_content_id_fkey FOREIGN KEY (program_content_id) REFERENCES public.program_content(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.program_content
    ADD CONSTRAINT program_content_content_body_id_fkey FOREIGN KEY (content_body_id) REFERENCES public.program_content_body(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.program_content
    ADD CONSTRAINT program_content_content_section_id_fkey FOREIGN KEY (content_section_id) REFERENCES public.program_content_section(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.program_content_log
    ADD CONSTRAINT program_content_log_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.program_content_log
    ADD CONSTRAINT program_content_log_program_content_id_fkey FOREIGN KEY (program_content_id) REFERENCES public.program_content(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.program_content_material
    ADD CONSTRAINT program_content_material_program_content_id_fkey FOREIGN KEY (program_content_id) REFERENCES public.program_content(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.program_content_plan
    ADD CONSTRAINT program_content_permission_program_content_id_fkey FOREIGN KEY (program_content_id) REFERENCES public.program_content(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.program_content_plan
    ADD CONSTRAINT program_content_permission_program_plan_id_fkey FOREIGN KEY (program_plan_id) REFERENCES public.program_plan(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.program_content_progress
    ADD CONSTRAINT program_content_progress_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.program_content_progress
    ADD CONSTRAINT program_content_progress_program_content_id_fkey FOREIGN KEY (program_content_id) REFERENCES public.program_content(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.program_content_section
    ADD CONSTRAINT program_content_section_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.program(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.program_content_video
    ADD CONSTRAINT program_content_stream_attachment_id_fkey FOREIGN KEY (attachment_id) REFERENCES public.attachment(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.program_content_video
    ADD CONSTRAINT program_content_stream_program_content_id_fkey FOREIGN KEY (program_content_id) REFERENCES public.program_content(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.program_package
    ADD CONSTRAINT program_package_app_id_fkey FOREIGN KEY (app_id) REFERENCES public.app(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.program_package_category
    ADD CONSTRAINT program_package_category_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.category(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.program_package_category
    ADD CONSTRAINT program_package_category_program_package_id_fkey FOREIGN KEY (program_package_id) REFERENCES public.program_package(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.program_package_plan
    ADD CONSTRAINT program_package_plan_program_package_id_fkey FOREIGN KEY (program_package_id) REFERENCES public.program_package(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.program_package_program
    ADD CONSTRAINT program_package_program_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.program(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.program_package_program
    ADD CONSTRAINT program_package_program_program_package_id_fkey FOREIGN KEY (program_package_id) REFERENCES public.program_package(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.program_plan
    ADD CONSTRAINT program_plan_currency_id_fkey FOREIGN KEY (currency_id) REFERENCES public.currency(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.program_plan
    ADD CONSTRAINT program_plan_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.program(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.program_related_item
    ADD CONSTRAINT program_related_item_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.program(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.program_role
    ADD CONSTRAINT program_role_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.program_role
    ADD CONSTRAINT program_role_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.program(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.program_tag
    ADD CONSTRAINT program_tag_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.program(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.program_tag
    ADD CONSTRAINT program_tag_tag_name_fkey FOREIGN KEY (tag_name) REFERENCES public.tag(name) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.program_tempo_delivery
    ADD CONSTRAINT program_tempo_delivery_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.program_tempo_delivery
    ADD CONSTRAINT program_tempo_delivery_program_package_program_id_fkey FOREIGN KEY (program_package_program_id) REFERENCES public.program_package_program(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.program_timetable
    ADD CONSTRAINT program_timetable_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.program_timetable
    ADD CONSTRAINT program_timetable_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.program(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.project_category
    ADD CONSTRAINT project_category_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.category(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.project_category
    ADD CONSTRAINT project_category_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.project(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.project_plan_product
    ADD CONSTRAINT project_plan_product_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.project_plan_product
    ADD CONSTRAINT project_plan_product_project_plan_id_fkey FOREIGN KEY (project_plan_id) REFERENCES public.project_plan(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.project_plan
    ADD CONSTRAINT project_plan_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.project(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.project_role
    ADD CONSTRAINT project_role_identity_id_fkey FOREIGN KEY (identity_id) REFERENCES public.identity(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.project_role
    ADD CONSTRAINT project_role_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.project_role
    ADD CONSTRAINT project_role_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.project(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.project_section
    ADD CONSTRAINT project_section_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.project(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.property
    ADD CONSTRAINT property_app_id_fkey FOREIGN KEY (app_id) REFERENCES public.app(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.question_group
    ADD CONSTRAINT question_group_modifier_id_fkey FOREIGN KEY (modifier_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.question_group
    ADD CONSTRAINT question_group_question_library_id_fkey FOREIGN KEY (question_library_id) REFERENCES public.question_library(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.question_library
    ADD CONSTRAINT question_library_modifier_id_fkey FOREIGN KEY (modifier_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.question_option
    ADD CONSTRAINT question_option_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.question(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.question
    ADD CONSTRAINT question_question_group_id_fkey FOREIGN KEY (question_group_id) REFERENCES public.question_group(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.review
    ADD CONSTRAINT review_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.review_reaction
    ADD CONSTRAINT review_reaction_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.review_reaction
    ADD CONSTRAINT review_reaction_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.review(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.review_reply
    ADD CONSTRAINT review_reply_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.review(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.role_permission
    ADD CONSTRAINT role_permission_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permission(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.role_permission
    ADD CONSTRAINT role_permission_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.role(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.setting
    ADD CONSTRAINT setting_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.module(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.sharing_code
    ADD CONSTRAINT sharing_code_app_id_fkey FOREIGN KEY (app_id) REFERENCES public.app(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.signup_property
    ADD CONSTRAINT signup_property_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.property(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.sms_verification_code
    ADD CONSTRAINT sms_verification_code_app_id_fkey FOREIGN KEY (app_id) REFERENCES public.app(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.social_card
    ADD CONSTRAINT social_card_member_social_id_fkey FOREIGN KEY (member_social_id) REFERENCES public.member_social(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.social_card_subscriber
    ADD CONSTRAINT social_card_subscriber_social_card_id_fkey FOREIGN KEY (social_card_id) REFERENCES public.social_card(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.user_oauth
    ADD CONSTRAINT user_oauth_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.venue_seat
    ADD CONSTRAINT venue_seat_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES public.venue(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.voucher_code
    ADD CONSTRAINT voucher_code_voucher_plan_id_fkey FOREIGN KEY (voucher_plan_id) REFERENCES public.voucher_plan(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.voucher
    ADD CONSTRAINT voucher_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.voucher_plan
    ADD CONSTRAINT voucher_plan_app_id_fkey FOREIGN KEY (app_id) REFERENCES public.app(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.voucher_plan_product
    ADD CONSTRAINT voucher_plan_product_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.voucher_plan_product
    ADD CONSTRAINT voucher_plan_product_voucher_plan_id_fkey FOREIGN KEY (voucher_plan_id) REFERENCES public.voucher_plan(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.voucher
    ADD CONSTRAINT voucher_voucher_code_id_fkey FOREIGN KEY (voucher_code_id) REFERENCES public.voucher_code(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
