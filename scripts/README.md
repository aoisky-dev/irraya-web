# Deployment update script

Use `scripts/deploy_updates.py` from the repository root whenever code changes need to be pushed to the Ubuntu production server.

The script matches the current production architecture:

- PostgreSQL runs directly on Ubuntu
- Redis, backend, frontend, and Cloudflare Tunnel run in Docker Compose
- Frontend is built on the Ubuntu host and packaged with `frontend/Dockerfile.prebuilt`
- Server-only secrets in `/home/ubuntu/apps/irraya-web/.env` and `deploy/prod/*.env` are preserved

## Full deploy

```bash
python3 scripts/deploy_updates.py \
  --migrate \
  --site-url https://irraya.com \
  --api-url https://api.irraya.com \
  --public-site-url https://irraya.com \
  --public-api-url https://api.irraya.com
```

## Frontend-only deploy

Use this after frontend code/style changes:

```bash
python3 scripts/deploy_updates.py \
  --skip-backend \
  --site-url https://irraya.com \
  --api-url https://api.irraya.com \
  --public-site-url https://irraya.com
```

## Backend-only deploy

Use this after backend API changes:

```bash
python3 scripts/deploy_updates.py \
  --skip-frontend \
  --migrate \
  --public-api-url https://api.irraya.com
```

## Dry run

Print the commands without executing them:

```bash
python3 scripts/deploy_updates.py --dry-run --skip-tests
```

## Notes

- The default SSH alias is `ubuntu-server`.
- The default remote directory is `/home/ubuntu/apps/irraya-web`.
- The script does not copy local `.env` files.
- Keep the Cloudflare Tunnel token only in the server `.env` file.

