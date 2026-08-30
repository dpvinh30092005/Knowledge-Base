# infrastructure

Docker Compose orchestration for the InteliPath stack (Postgres + `intelipath-service` AI
service + `intelipath-backend`). Split out from `intelipath-backend` so deploy/ops config
lives separately from application source.

For a full production deploy to a VPS (Nginx + HTTPS + the frontend), see [`DEPLOY.md`](DEPLOY.md).
The `nginx/` directory holds the reverse-proxy site config referenced there.

## Folder layout this expects

Clone all repos as siblings:

```
BackEnd/
  infrastructure/       <- this repo
  intelipath-backend/
  intelipath-service/
```

## Quick start

1. Clone `intelipath-backend` and `intelipath-service` next to this repo (see layout above).
2. In `intelipath-backend/`, copy `.env.example` → `.env` and fill in credentials
   (this is also where `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` /
   `POSTGRES_PORT` live — shared by the `postgres` service below).
3. In `intelipath-service/`, copy `.env.example` → `.env` and fill in credentials.
4. From this repo:
   ```bash
   docker compose --env-file ../intelipath-backend/.env up -d
   ```
5. Open `http://localhost:8080/swagger-ui.html` (dev only — disabled when the backend
   runs with the `prod` Spring profile).

## What's here

- `docker-compose.yml` — the three services (`postgres`, `ai-service`, `backend`) and how
  they're wired together on the compose network.
- `docker/postgres/init/` — SQL run once on first Postgres container start, creating the
  `scraper` and `intelipath` databases.

No secrets are stored in this repo — every credential comes from the `.env` files in the
app repos via `env_file:`/`--env-file`, which are git-ignored there.
