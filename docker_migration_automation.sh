#!/bin/bash

set -e

rm -rf migrations/hasura/migrations/default/
rm -rf migrations/hasura/metadata/*
rm -rf migrations/hasura/seeds/*

docker-compose -f docker-compose.yml --profile test down --volumes

hasura migrate create Init --from-server --endpoint HASURA_END_POINT --admin-secret SECRET --database-name default --project migrations/hasura/ --schema SCHEMATA_SPLIT_WITH_COMMAS
hasura metadata export --endpoint HASURA_END_POINT --admin-secret SECRET --project migrations/hasura/metadata
hasura sd create SEED_FILE_NAME --endpoint HASURA_END_POINT --admin-secret SECRET --database-name default --project migrations/hasura/seeds --from-table TABLE_1 --from-table TABLE_2

docker-compose -f docker-compose.yml --profile test up -d

echo "Waiting for Docker services to start..."
sleep 3  

hasura migrate apply --endpoint http://localhost:8080/ --admin-secret SECRET --database-name default --project migrations/hasura --skip-update-check
hasura sd apply --endpoint http://localhost:8080/ --admin-secret SECRET --database-name default --project migrations/hasura --skip-update-check
hasura md apply --endpoint http://localhost:8080/ --admin-secret SECRET --project migrations/hasura

echo "All commands executed successfully."