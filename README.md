# Hobbyist

A full-stack monorepo for hobbyists to connect, trade, and share interests.

**Stack:** React Native (Expo) · React + Vite · .NET 10 · PostgreSQL · Redis · MinIO · Tailscale (required)

## Tech Stack

| Layer      | Tech                                                                                                                                                                                                                                                 |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mobile     | React Native 19, Expo, React Navigation, React Native Paper                                                                                                                                                                                          |
| Web        | React 19, TypeScript, Vite, Material-UI, TanStack Router                                                                                                                                                                                             |
| Shared     | TanStack Query, React Hook Form, Zod, Axios                                                                                                                                                                                                          |
| Backend    | .NET 10, Entity Framework Core, JWT Auth                                                                                                                                                                                                             |
| Database   | PostgreSQL (Docker)                                                                                                                                                                                                                                  |
| Cache      | Redis (Docker)                                                                                                                                                                                                                                       |
| Media      | MinIO (S3-compatible, Docker)                                                                                                                                                                                                                        |
| Networking | [Tailscale](https://tailscale.com/download) — stable HTTPS across all devices regardless of network/IP. Without it, any device not on the same WiFi as the server machine, or where the server's IP has changed, won't be able to reach the servers. |

## Structure

| Folder       | Purpose            |
| ------------ | ------------------ |
| `Mobile/`    | React Native app   |
| `Website/`   | React web app      |
| `WebServer/` | .NET Core API      |
| `Shared/`    | Shared TS packages |

## Prerequisites

- Node.js 24+
- [pnpm](https://pnpm.io/installation) 10+
- .NET SDK 10+
- [Docker Desktop](https://docs.docker.com/get-docker/) (recommended for local infra)
- [Tailscale](https://tailscale.com/download) (required)

## Setup

### 1. Clone & copy configs

```bash
git clone https://github.com/Eri-py/Hobbyist.git
cd Hobbyist
pnpm exec node Scripts/copy-configs.js
```

This copies all setup templates from `Setup/` into runtime locations.

Templates are grouped by target app to keep Setup maintainable:

- `Setup/WebServer/`
- `Setup/Website/`
- `Setup/Mobile/`

### 2. Install dependencies

```bash
pnpm install
```

### 3. Start local infrastructure (Docker Compose)

> **IMPORTANT:** **Use your own existing Postgres, Redis, and MinIO instances if you already have them.** Start the provided compose template only if you do not already have local services.

```bash
docker compose -f Setup/WebServer/docker-compose.yml --profile all up -d
```

If you use the compose defaults, these are the local credentials:

- Postgres: `postgres` / `Password123.` (DB: `hobbyistdb`, Port: `5432`)
- Redis: no password by default (Port: `6379`)
- MinIO: `minioadmin` / `Password123.` (API: `9000`, Console: `9001`)

> **TIP:** **Optional overrides:** Create `Setup/WebServer/.env` only if you want to override defaults. Replace only the variables you need:

> - `POSTGRES_USER`
> - `POSTGRES_PASSWORD`
> - `POSTGRES_DB`
> - `POSTGRES_PORT`
> - `REDIS_PORT`
> - `MINIO_ROOT_USER`
> - `MINIO_ROOT_PASSWORD`
> - `MINIO_API_PORT`
> - `MINIO_CONSOLE_PORT`

Profile-specific startup (optional):

```bash
docker compose -f Setup/WebServer/docker-compose.yml --profile db up -d
docker compose -f Setup/WebServer/docker-compose.yml --profile cache up -d
docker compose -f Setup/WebServer/docker-compose.yml --profile storage up -d
```

Useful commands:

```bash
docker compose -f Setup/WebServer/docker-compose.yml down
docker compose -f Setup/WebServer/docker-compose.yml logs -f
```

> **RECOMMENDED:** After running the compose startup command above, open Docker Desktop and go to Containers.
>
> - Start or stop the compose stack, or individual containers, from the UI.
> - View container status, mapped ports, logs, and other runtime details without using the terminal.

### 4. Tailscale & HTTPS cert

Find your MagicDNS hostname in the Tailscale app (e.g. `{your-machine.tail123456.ts.net}`), then in an elevated PowerShell:

```powershell
cd certs
tailscale cert {your-machine.tail123456.ts.net}
```

> Cert expires every 90 days — re-run to renew.

### 5. Configure copied runtime files

**`Website/.env.development`**

```
VITE_TAILSCALE_HOST={your-machine.tail123456.ts.net}
VITE_API_BASE_URL=https://{your-machine.tail123456.ts.net}:7000/api
```

**`Mobile/.env.development`**

```
EXPO_PUBLIC_API_BASE_URL=https://{your-machine.tail123456.ts.net}:7000/api
REACT_NATIVE_PACKAGER_HOSTNAME={your-host-device-tailscale-ip} # optional
```

Mobile default dev command (no host pinning):

```bash
pnpm --filter mobile dev
```

Optional: start mobile with host pinning from `Mobile/.env.development`:

```bash
pnpm --filter mobile dev:host
```

The optional script reads `REACT_NATIVE_PACKAGER_HOSTNAME` from `Mobile/.env.development` and sets it before running Expo.
If your network already allows direct device-to-device communication, you can skip this and use the default `dev` script.

Type generation now reads your existing `Website/.env.development` (`VITE_API_BASE_URL`) or
`Mobile/.env.development` (`EXPO_PUBLIC_API_BASE_URL`) automatically.

Run:

```bash
pnpm generate-types
```

If you want to override the endpoint for a one-off run, set `OPENAPI_URL`:

```powershell
$env:OPENAPI_URL="https://{your-machine.tail123456.ts.net}:7000/openapi/v1.json"; pnpm generate-types
```

```bash
OPENAPI_URL=https://{your-machine.tail123456.ts.net}:7000/openapi/v1.json pnpm generate-types
```

If you must use a self-signed cert temporarily, opt in explicitly:

```powershell
$env:OPENAPI_INSECURE_TLS="1"; $env:OPENAPI_URL="https://{your-machine.tail123456.ts.net}:7000/openapi/v1.json"; pnpm generate-types
```

**`WebServer/Hobbyist.Api/appsettings.Development.json`**

> **IMPORTANT:** Ensure these values match your local environment:
>
> - `ClientOrigin:Address`
> - `Kestrel:Endpoints:Https:Url`
> - certificate paths under `Kestrel:Endpoints:Https:Certificate`
> - `ConnectionStrings:DefaultConnection`
> - `ConnectionStrings:Redis`
> - `MediaStorage` section
> - `Jwt` and `Security` secrets
>
> If you use the provided compose defaults, `MediaStorage` should point to MinIO on port `9000`.

### 6. Create MinIO bucket (one-time)

The setup compose file does not auto-create buckets.

1. Open MinIO console at `http://localhost:9001`
2. Sign in with `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD`
3. Create bucket: `hobbyist-posts`

### 7. Apply database migrations

```bash
cd WebServer/Hobbyist.Api
dotnet ef database update
```

> First time only: `dotnet tool install --global dotnet-ef`

### 8. Feature flags (dev overrides)

`featureflags.Development.json` is gitignored and copied for you by `copy-configs.js`.

When adding a new flag:

1. Add it to `featureflags.json` (set `false`)
2. Run `pnpm generate-feature-flags` to regenerate `Services/FeatureFlags.cs` and `Shared/types/src/featureFlags.ts`
3. Run `pnpm generate-types` to regenerate API-derived TypeScript types
4. Add the new flag to your local `featureflags.Development.json`

## Ports

| Service       | Port |
| ------------- | ---- |
| API           | 7000 |
| Website       | 3000 |
| PostgreSQL    | 5432 |
| Redis         | 6379 |
| MinIO API     | 9000 |
| MinIO Console | 9001 |

## Running

> Optionally copy `Setup/.vscode` into repo root and use the VS Code debugger to start backend with the provided launch profile.

```bash
# Backend (from WebServer/Hobbyist.Api/)
dotnet watch

# Website (from Website/)
pnpm run dev

# Mobile (from Mobile/)
pnpm run dev
```

## Common Commands

```bash
pnpm typecheck                # Type check all projects
pnpm lint                     # Lint
pnpm build                    # Production build
pnpm test                     # Run tests
pnpm generate-types           # Generate TS types from OpenAPI (backend must be running)
pnpm generate-feature-flags   # Regenerate FeatureFlags.cs + featureFlags.ts
pnpm clean                    # Remove node_modules and build artifacts
pnpm reset                    # Clean + reinstall
```

## API Docs

`https://{your-machine.tail123456.ts.net}:7000/scalar/v1` (backend must be running)

## Troubleshooting

- **DB errors**: verify Postgres is running and your `DefaultConnection` matches
- **Redis errors**: verify Redis is running and your `ConnectionStrings:Redis` is correct
- **MinIO errors**: verify MinIO is running, credentials match, and `hobbyist-posts` bucket exists
- **Migration issues**: run `dotnet ef database update` again after checking connection string
- **SSL errors**: verify cert exists in `certs/` and is not expired
- **Mobile connectivity issues**: confirm Tailscale is active on both machine and device
- **Type errors after API changes**: run `pnpm generate-types`
- **Shared package missing**: run `pnpm install`
