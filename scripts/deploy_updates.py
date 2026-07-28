#!/usr/bin/env python3
"""Deploy code updates to the Irraya home-server production stack.

This script is intended to be run from the repository root on the developer
machine. It syncs source files to the Ubuntu server and then runs the same
production deployment flow currently used on the server:

- PostgreSQL stays on the Ubuntu host
- Redis, backend, frontend, and cloudflared run in Docker Compose
- frontend is built on the host and packaged using frontend/Dockerfile.prebuilt

Secrets are never copied from the local machine. The server-only files
/home/ubuntu/apps/irraya-web/.env and deploy/prod/*.env are preserved.
"""

from __future__ import annotations

import argparse
import shlex
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_HOST = "ubuntu-server"
DEFAULT_REMOTE_DIR = "/home/ubuntu/apps/irraya-web"
COMPOSE = "docker compose -f docker-compose.prod.yml --env-file .env"


def run(command: list[str], *, cwd: Path | None = None, dry_run: bool = False) -> None:
    printable = " ".join(shlex.quote(part) for part in command)
    print(f"$ {printable}")
    if dry_run:
        return
    subprocess.run(command, cwd=cwd, check=True)


def ssh(host: str, script: str, *, dry_run: bool = False) -> None:
    run(["ssh", host, "bash", "-lc", script], dry_run=dry_run)


def rsync(host: str, remote_dir: str, *, dry_run: bool = False) -> None:
    excludes = [
        ".git",
        ".DS_Store",
        "node_modules",
        "backend/node_modules",
        "frontend/node_modules",
        "backend/.medusa",
        "frontend/.next",
        "frontend/tsconfig.tsbuildinfo",
        "coverage",
        ".cache",
        "*.log",
        ".env",
        ".env.*",
        "backend/.env",
        "backend/.env.*",
        "frontend/.env",
        "frontend/.env.*",
        "deploy/prod/*.env",
    ]

    command = ["rsync", "-az", "--delete"]
    for item in excludes:
        command.extend(["--exclude", item])
    command.extend([f"{REPO_ROOT}/", f"{host}:{remote_dir}/"])
    run(command, dry_run=dry_run)


def maybe_update_public_env(
    host: str,
    remote_dir: str,
    site_url: str | None,
    api_url: str | None,
    admin_url: str | None,
    *,
    dry_run: bool,
) -> None:
    updates: dict[str, str] = {}
    if site_url:
        updates["NEXT_PUBLIC_SITE_URL"] = site_url.rstrip("/")
    if api_url:
        updates["NEXT_PUBLIC_MEDUSA_BASE_URL"] = api_url.rstrip("/")
    if admin_url:
        updates["NEXT_PUBLIC_MEDUSA_ADMIN_URL"] = admin_url.rstrip("/")
    elif api_url:
        updates["NEXT_PUBLIC_MEDUSA_ADMIN_URL"] = f"{api_url.rstrip('/')}/app"

    if not updates:
        return

    assignments = "\n".join(f"    {key!r}: {value!r}," for key, value in updates.items())
    script = f"""
set -euo pipefail
cd {shlex.quote(remote_dir)}
python3 - <<'PY'
from pathlib import Path
updates = {{
{assignments}
}}
for rel in [".env", "deploy/prod/frontend.env"]:
    path = Path(rel)
    lines = path.read_text().splitlines() if path.exists() else []
    seen = set()
    out = []
    for line in lines:
        key = line.split("=", 1)[0] if "=" in line else ""
        if key in updates:
            out.append(f"{{key}}={{updates[key]}}")
            seen.add(key)
        else:
            out.append(line)
    for key, value in updates.items():
        if key not in seen:
            out.append(f"{{key}}={{value}}")
    path.write_text("\\n".join(out) + "\\n")
    path.chmod(0o600)
PY
"""
    ssh(host, script, dry_run=dry_run)


def remote_deploy_script(args: argparse.Namespace) -> str:
    steps: list[str] = [
        "set -euo pipefail",
        f"cd {shlex.quote(args.remote_dir)}",
        "test -f .env || { echo 'Missing server .env'; exit 1; }",
        "chmod 600 .env deploy/prod/backend.env deploy/prod/frontend.env 2>/dev/null || true",
        f"{COMPOSE} config --services >/tmp/irraya-compose-services.txt",
    ]

    if not args.skip_frontend:
        steps.extend(
            [
                "echo '== Building frontend standalone output on host =='",
                "cd frontend",
                "rm -rf .next",
                "set -a",
                ". ../.env",
                "set +a",
                "npm ci --prefer-offline --no-audit --no-fund",
                "npm run build",
                "test -f .next/standalone/server.js",
                "cd ..",
            ]
        )

    build_services: list[str] = []
    if not args.skip_backend:
        build_services.append("backend")
    if not args.skip_frontend:
        build_services.append("frontend")

    if build_services:
        for service in build_services:
            no_cache = " --no-cache" if service == "frontend" or args.no_cache else ""
            steps.append(f"echo '== Building Docker image: {service} =='")
            steps.append(f"{COMPOSE} build{no_cache} {service}")

    if args.migrate:
        steps.extend(
            [
                "echo '== Running backend migrations =='",
                f"{COMPOSE} run --rm backend npm run migrate",
            ]
        )

    services = "redis backend frontend cloudflared" if not args.no_tunnel else "redis backend frontend"
    steps.extend(
        [
            "echo '== Starting services =='",
            f"{COMPOSE} up -d {services}",
            "echo '== Container status =='",
            f"{COMPOSE} ps",
            "echo '== Local health checks =='",
            "curl -fsS http://127.0.0.1:9000/health >/dev/null",
            "curl -fsS http://127.0.0.1:3000/ >/dev/null",
        ]
    )

    if args.public_site_url:
        steps.append(f"curl -fsS -I {shlex.quote(args.public_site_url.rstrip('/'))} >/dev/null || true")
    if args.public_api_url:
        steps.append(f"curl -fsS {shlex.quote(args.public_api_url.rstrip('/') + '/health')} >/dev/null || true")

    steps.append("echo 'Deployment update completed successfully.'")
    return "\n".join(steps)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Deploy Irraya code updates to the Ubuntu production server.")
    parser.add_argument("--host", default=DEFAULT_HOST, help="SSH host alias. Default: ubuntu-server")
    parser.add_argument("--remote-dir", default=DEFAULT_REMOTE_DIR, help="Remote app directory.")
    parser.add_argument("--skip-tests", action="store_true", help="Skip local frontend auth tests and typecheck.")
    parser.add_argument("--skip-sync", action="store_true", help="Do not rsync local files to the server.")
    parser.add_argument("--skip-backend", action="store_true", help="Do not rebuild backend image.")
    parser.add_argument("--skip-frontend", action="store_true", help="Do not rebuild frontend host output/image.")
    parser.add_argument("--migrate", action="store_true", help="Run backend database migrations before restart.")
    parser.add_argument("--no-cache", action="store_true", help="Force no-cache for Docker image builds.")
    parser.add_argument("--no-tunnel", action="store_true", help="Do not start/restart cloudflared.")
    parser.add_argument("--site-url", help="Update NEXT_PUBLIC_SITE_URL in server env files, e.g. https://irraya.com")
    parser.add_argument("--api-url", help="Update NEXT_PUBLIC_MEDUSA_BASE_URL, e.g. https://api.irraya.com")
    parser.add_argument("--admin-url", help="Update NEXT_PUBLIC_MEDUSA_ADMIN_URL. Defaults to <api-url>/app when --api-url is set.")
    parser.add_argument("--public-site-url", help="Optional public site URL to probe after deploy.")
    parser.add_argument("--public-api-url", help="Optional public API URL to probe after deploy.")
    parser.add_argument("--dry-run", action="store_true", help="Print commands without running them.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    if args.skip_backend and args.skip_frontend and not args.migrate:
        print("Nothing to build or migrate. Use fewer skip flags.", file=sys.stderr)
        return 2

    if not args.skip_tests:
        run(["npm", "test", "--", "auth.spec.ts"], cwd=REPO_ROOT / "frontend", dry_run=args.dry_run)
        run(["npm", "run", "typecheck"], cwd=REPO_ROOT / "frontend", dry_run=args.dry_run)

    if not args.skip_sync:
        rsync(args.host, args.remote_dir, dry_run=args.dry_run)

    maybe_update_public_env(
        args.host,
        args.remote_dir,
        args.site_url,
        args.api_url,
        args.admin_url,
        dry_run=args.dry_run,
    )

    ssh(args.host, remote_deploy_script(args), dry_run=args.dry_run)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

