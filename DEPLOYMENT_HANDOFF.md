# Deployment handoff

Use this file when handing deployment to another person or another ChatGPT/Codex conversation.

## Copy/paste prompt

> Help me deploy the Lincoln College PAT Test & Trace app in this workspace to my Linux VPS. It is a Next.js 16 TypeScript app using PostgreSQL and Docker Compose. Read `README.md`, `DEPLOYMENT_HANDOFF.md`, `.env.example`, `docker-compose.yml`, `Dockerfile`, `Caddyfile.example`, and `lib/adam/live.ts` before changing anything.
>
> Work with me step by step. First inspect the VPS OS, DNS hostname, firewall, Docker/Compose availability, and the actual Adam RMS API documentation/response format. Do not ask me to paste passwords, the Adam API key, or other secrets into chat; tell me exactly which values to place directly in the VPS `.env` file instead. Do not weaken the `ADAM_COMPANY_ID` checks. Adam access must remain read-only, and an asset response without the configured company ID must fail closed.
>
> Confirm the live Adam endpoint and field mapping in `lib/adam/live.ts` using one known Lincoln College asset and one asset from another company (the latter must return no asset). Then run `docker compose config`, build and start the containers, check `/api/health`, configure HTTPS with Caddy or the existing reverse proxy, test PIN login, add/select a tester, look up an asset, record a test, verify the PAT register, and download an XLSX export. Do not make the app public until HTTPS, company isolation, backups, and the full smoke test pass. Record any code/configuration changes and provide rollback commands.

## Information to have ready

- VPS SSH hostname and username (share only when comfortable).
- Public DNS name intended for the app.
- Whether nginx, Caddy, Traefik, or another proxy already runs on the VPS.
- Adam RMS API documentation or a redacted sample asset response.
- One known Lincoln College asset number for testing.
- A list of initial tester names.

Keep these secret and enter them directly on the VPS, not in chat:

- `ADAM_API_KEY`
- `POSTGRES_PASSWORD`
- `PAT_PIN`
- `SESSION_SECRET`

## Acceptance checklist

- `docker compose ps` shows both services healthy.
- `https://YOUR_HOST/api/health` returns `{"status":"ok"}`.
- HTTP redirects to HTTPS and the browser shows a valid certificate.
- Correct PIN works; an incorrect PIN fails.
- Tester selection and adding a tester both persist after restart.
- A known Lincoln asset resolves live from Adam.
- A foreign-company asset cannot be returned or saved.
- PASS and FAIL records save locally and appear in history/register.
- The default next due date is one calendar year later.
- Current, filtered, and history XLSX files open correctly.
- A PostgreSQL backup can be created and restored.
