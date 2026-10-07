# Lincoln College PAT Test & Trace

A small, barcode-first PAT recording app. It stores PAT results in PostgreSQL and reads asset information live from Adam RMS. It never imports or synchronises the Adam asset library.

## Run locally with Docker

1. Copy `.env.example` to `.env`.
2. Change `PAT_PIN`, `SESSION_SECRET`, and the database password.
3. Leave `ADAM_PROVIDER=mock` for development.
4. Run:

```bash
docker compose up --build
```

Open <http://localhost:3000>. Mock asset numbers are `LC1001`, `LC1002`, and `LC1003`; their mock barcodes are also accepted.

The app creates its `pat_tests` table and indexes on first database use. PostgreSQL data is retained in the `pat_data` Docker volume.

## VPS deployment

The container publishes the app only on `127.0.0.1:3000`, so use a reverse proxy on the same VPS. `Caddyfile.example` is supplied for automatic HTTPS. PostgreSQL is internal-only and is not published on a host port.

1. Install Docker Engine, the Docker Compose plugin, and a reverse proxy such as Caddy.
2. Copy the project to the VPS and run `cp .env.example .env`.
3. Edit `.env` directly on the VPS. At minimum:
   - choose a strong `POSTGRES_PASSWORD` and put the same password in `DATABASE_URL`;
   - set a four-digit `PAT_PIN`;
   - generate a random `SESSION_SECRET` of at least 32 characters;
   - set `APP_ORIGIN=https://YOUR_HOST` with no trailing slash;
   - set `ADAM_PROVIDER=adam`, the real `ADAM_BASE_URL`, `ADAM_API_KEY`, and `ADAM_COMPANY_ID`;
   - set the initial comma-separated `PAT_TESTERS` list.
4. Validate and start:

```bash
docker compose config
docker compose up -d --build
docker compose ps
curl --fail http://127.0.0.1:3000/api/health
```

5. Copy `Caddyfile.example` into the server's Caddy configuration, replace the hostname, validate it, and reload Caddy.
6. Complete the acceptance checklist in `DEPLOYMENT_HANDOFF.md` before wider use.

Generate secrets with a trusted password manager or `openssl rand -base64 48`. Keep `.env` out of source control and never paste production secrets into chat.

### Updates and logs

```bash
docker compose logs -f --tail=100 app
docker compose up -d --build
docker image prune
```

Review changes and take a database backup before updating. Do not use `docker compose down -v`; `-v` deletes the PAT database volume.

### PostgreSQL backup

Create a dated logical backup outside the container:

```bash
mkdir -p backups
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "backups/pat-$(date +%F).dump"
```

Copy backups off the VPS and test restoration periodically. To restore into an empty database, use `pg_restore` with the same PostgreSQL major version.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection used by the app (Compose supplies its internal value) |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Compose database credentials |
| `PAT_PIN` | Required 4-digit login PIN |
| `SESSION_SECRET` | Signs 12-hour, HTTP-only session cookies |
| `PAT_TESTERS` | Comma-separated tester names |
| `APP_ORIGIN` | Expected browser origin for write requests |
| `ADAM_PROVIDER` | `mock` or `adam` |
| `ADAM_BASE_URL` | Adam API root URL |
| `ADAM_API_KEY` | Adam API bearer token |
| `ADAM_COMPANY_ID` | The only Adam company this app may return |

## Adam RMS adapter

All Adam-specific code is in `lib/adam/live.ts`. The included live adapter assumes these read-only endpoints:

- `GET {ADAM_BASE_URL}/assets?companyId=…&search=…&limit=10`
- `GET {ADAM_BASE_URL}/assets/{id}?companyId=…`

It sends `Authorization: Bearer …` and `X-Company-ID` as well. Adam installations/API versions can differ, so adjust only this adapter if the real endpoint or response field names differ.

`ADAM_COMPANY_ID` is enforced as a security boundary in three ways:

1. Every lookup and ID request includes it.
2. Every returned asset must explicitly contain the same company ID; missing or different company data is rejected.
3. Saving a PAT result re-fetches the asset by ID through that protected adapter. Client-submitted names/numbers are ignored.

The integration performs GET requests only. No Adam data is edited. The PAT register fetches live Adam data only for assets that already have local PAT records; it does not enumerate or cache the full asset library.

## Workflow and exports

After PIN login, select a tester and scan/type an asset number. Scanner Enter submits automatically. The next due date defaults to one calendar year from the test date. On the result screen use `P` for pass, `F` for fail, or `Esc` to return to scanning. A failure reason is mandatory for failed tests.

The register has client-side search, filters, sorting, and 20-row pagination. The three `.xlsx` options export the current register, full history, or the current filtered/sorted register view. Adam-sourced serial and location values are refreshed when the page or export is requested.

## Non-Docker development

Use Node.js 22 and a PostgreSQL server:

```bash
npm install
npm run dev
```

Useful checks:

```bash
npm run lint
npm run build
```
