COMPOSE_FILE = docker-compose.yml
PROFILE = test
HASURA_ENDPOINT = http://localhost:8080/
DATABASE_NAME = default
MIGRATIONS_DIR = migrations/hasura

cleanup:
	docker-compose -f $(COMPOSE_FILE) --profile $(PROFILE) down --volumes

testup:
	docker-compose -f $(COMPOSE_FILE) --profile $(PROFILE) up -d

testmigrate:	
	sleep 3
	hasura migrate apply --endpoint $(HASURA_ENDPOINT) --database-name $(DATABASE_NAME) --project $(MIGRATIONS_DIR) --skip-update-check

testapply:
	hasura sd apply --endpoint $(HASURA_ENDPOINT) --database-name $(DATABASE_NAME) --project $(MIGRATIONS_DIR) --skip-update-check

testsetup: cleanup testup testmigrate testapply

.PHONY: cleanup testup testmigrate testapply testsetup