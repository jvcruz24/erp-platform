#!/bin/sh
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-SQL
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'erp_user') THEN
    CREATE ROLE erp_user LOGIN PASSWORD 'erp_password';
  END IF;
END$$;

GRANT ALL PRIVILEGES ON DATABASE erp_db TO erp_user;

\connect erp_db
GRANT ALL ON SCHEMA public TO erp_user;
ALTER SCHEMA public OWNER TO erp_user;
SQL