#!/bin/bash
# Creates multiple PostgreSQL databases from the POSTGRES_MULTIPLE_DATABASES env var.
# Called by the postgres:16-alpine docker-entrypoint initdb hook.
set -e

if [ -n "$POSTGRES_MULTIPLE_DATABASES" ]; then
  for db in $(echo "$POSTGRES_MULTIPLE_DATABASES" | tr ',' ' '); do
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
      CREATE DATABASE $db;
EOSQL
  done
fi
