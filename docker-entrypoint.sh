#!/bin/sh
set -e

# Map BACKEND_URL from .env to nginx's API_UPSTREAM in this shell so envsubst can see it.
# localhost inside a container points at the container, not the host machine.
if [ -z "$BACKEND_URL" ]; then
  echo "BACKEND_URL is not set. Add it to .env" >&2
  exit 1
fi
API_UPSTREAM=$(echo "$BACKEND_URL" | sed 's|//localhost|//host.docker.internal|g' | sed 's|//127.0.0.1|//host.docker.internal|g')
export API_UPSTREAM
export NGINX_ENVSUBST_FILTER=API_UPSTREAM

exec /docker-entrypoint.sh "$@"
