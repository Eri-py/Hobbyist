#!/bin/sh
# Converts postgres:// URL to Npgsql key=value format, then runs the EF bundle.
URL="${DATABASE_URL:-$ConnectionStrings__DefaultConnection}"

if echo "$URL" | grep -qE "^postgres(ql)?://"; then
  URL="${URL#postgres://}"
  URL="${URL#postgresql://}"
  USERPASS="${URL%%@*}"
  URL="${URL#*@}"
  DB_USER="${USERPASS%%:*}"
  DB_PASS="${USERPASS#*:}"
  HOSTPORT="${URL%%/*}"
  DB_NAME="${URL#*/}"
  DB_HOST="${HOSTPORT%%:*}"
  DB_PORT="${HOSTPORT#*:}"
  CONNECTION="Host=${DB_HOST};Port=${DB_PORT};Database=${DB_NAME};Username=${DB_USER};Password=${DB_PASS};"
else
  CONNECTION="$URL"
fi

/app/efbundle --connection "$CONNECTION"
