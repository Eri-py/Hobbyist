# Hobbyist

A full-stack monorepo for hobbyists to connect, trade, and share interests.

**Stack:** React Native (Expo) · React + Vite · .NET 9 · PostgreSQL · Tailscale (required)

## Tech Stack

| Layer      | Tech                                                                                                                                                                                                                                                 |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mobile     | React Native 19, Expo, React Navigation, React Native Paper                                                                                                                                                                                          |
| Web        | React 19, TypeScript, Vite, Material-UI, TanStack Router                                                                                                                                                                                             |
| Shared     | TanStack Query, React Hook Form, Zod, Axios                                                                                                                                                                                                          |
| Backend    | .NET Core 9, Entity Framework Core, JWT Auth                                                                                                                                                                                                         |
| Database   | PostgreSQL (Docker)                                                                                                                                                                                                                                  |
| Networking | [Tailscale](https://tailscale.com/download) — stable HTTPS across all devices regardless of network/IP. Without it, any device not on the same WiFi as the server machine, or where the server's IP has changed, won't be able to reach the servers. |

## Structure

| Folder       | Purpose            |
| ------------ | ------------------ |
| `Mobile/`    | React Native app   |
| `Website/`   | React web app      |
| `WebServer/` | .NET Core API      |
| `Shared/`    | Shared TS packages |

## Prerequisites

- Node.js 24+, [pnpm](https://pnpm.io/installation) 10+, .NET SDK 9+, [Docker](https://docs.docker.com/get-docker/), [Tailscale](https://tailscale.com/download) (required)

## Setup

### 1. Clone & copy configs

```bash
git clone https://github.com/Eri-py/Hobbyist.git
cd Hobbyist
pnpm exec node Scripts/copy-configs.js
```

### 2. Tailscale & HTTPS cert

Find your MagicDNS hostname in the Tailscale app (e.g. `{your-machine.tail123456.ts.net}`), then in an elevated PowerShell:

```powershell
cd certs
tailscale cert {your-machine.tail123456.ts.net}
```

> Cert expires every 90 days — re-run to renew.

### 3. Configure env files

**`Website/.env.development`**

```
VITE_TAILSCALE_HOST={your-machine.tail123456.ts.net}
VITE_API_BASE_URL=https://{your-machine.tail123456.ts.net}:7000/api
```

**`Mobile/.env.development`**

```
EXPO_PUBLIC_API_BASE_URL=https://{your-machine.tail123456.ts.net}:7000/api
```

**`Mobile/package.json`** — update the `dev` script:
Use the Tailscale IP/hostname of the **host machine running Expo/Metro** (your laptop/PC), not the host device Tailscale IP.

```json
"dev": "set REACT_NATIVE_PACKAGER_HOSTNAME={your-host-device-tailscale-ip} && expo start"
```

**`Shared/types/package.json`** — update `generate-types`:

```json
"generate-types": "cross-env NODE_TLS_REJECT_UNAUTHORIZED=0 openapi-typescript https://{your-machine.tail123456.ts.net}:7000/openapi/v1.json -o src/types.ts"
```

**`WebServer/Hobbyist.Api/appsettings.Development.json`**

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=hobbyist;Username=postgres;Password={your_password}"
  },
  "ClientOrigin": { "Address": "https://{your-machine.tail123456.ts.net}:3000" },
  "Kestrel": {
    "Endpoints": {
      "Https": {
        "Url": "https://{your-machine.tail123456.ts.net}:7000",
        "Certificate": {
          "Path": "../../certs/{your-machine.tail123456.ts.net}.crt",
          "KeyPath": "../../certs/{your-machine.tail123456.ts.net}.key"
        }
      }
    }
  }
}
```

### 4. Install dependencies

```bash
pnpm install
```

### 5. Database

```bash
# Start Postgres
docker run --name hobbyist-postgres -e POSTGRES_PASSWORD={your_password} -e POSTGRES_DB=hobbyist -p 5432:5432 -d postgres:latest

# Apply migrations
cd WebServer/Hobbyist.Api
dotnet ef database update
```

> First time: `dotnet tool install --global dotnet-ef`

## Ports

| Service    | Port |
| ---------- | ---- |
| API        | 7000 |
| Website    | 3000 |
| PostgreSQL | 5432 |

## Running

> Alternatively, copy the `.vscode` folder from `Setup/` to the root and use the VS Code debugger to start the backend. If you do, update `uriFormat` in `.vscode/launch.json` with your Tailscale hostname:
>
> ```jsonc
>  "uriFormat": "https://{your-machine-name.tail123456.ts.net}:%s/scalar/v1",
> ```

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
pnpm typecheck       # Type check all projects
pnpm lint                # Lint
pnpm build           # Production build
pnpm generate-types  # Generate TS types from OpenAPI (requires backend running)
pnpm clean           # Remove node_modules and build artifacts
pnpm reset           # Clean + reinstall
```

## API Docs

`https://{your-machine.tail123456.ts.net}:7000/scalar/v1` (requires backend running)

## Troubleshooting

- **DB errors** — check Docker is running (`docker ps`) and the connection string matches
- **Migration issues** — delete `Migrations/`, re-run `dotnet ef migrations add InitialCreate && dotnet ef database update`
- **SSL errors** — verify cert exists in `certs/` and hasn't expired
- **Mobile can't connect** — confirm Tailscale is running on both machine and device
- **Type errors after API changes** — run `pnpm generate-types`
- **Shared package not found** — run `pnpm install`
