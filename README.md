# Hobbyist

A full-stack application for hobbyists to connect, trade, and share their interests. Built with React Native (mobile), React (web), and .NET (backend).

## Project Structure

This is a monorepo managed with pnpm workspaces:

- **Mobile/** - React Native mobile app using Expo
- **Website/** - React web application with Vite
- **WebServer/** - .NET Core backend API
- **Shared/** - Shared TypeScript packages (hooks, types, form schemas)

## Tech Stack

### Frontend

- **Mobile**: React Native 19, Expo, React Navigation, React Native Paper
- **Web**: React 19, TypeScript, Vite, Material-UI, TanStack Router
- **Shared**: TanStack Query, React Hook Form, Zod, Axios

### Backend

- **.NET**: Core 9.0, Entity Framework Core, JWT Authentication
- **Database**: PostgreSQL (via Docker)
- **API Docs**: Scalar (OpenAPI/Swagger)

### External Tools

- **Docker**: PostgreSQL database container
- **Tailscale**: Required for all development — provides HTTPS across all devices via MagicDNS

## Prerequisites

- **Node.js**: 24.x or higher
- **pnpm**: 10.x or higher (package manager)
- **.NET SDK**: 9.0 or higher
- **Docker**: For PostgreSQL database
- **Tailscale**: Required — the project runs entirely over Tailscale HTTPS. Without it, nothing will work.

## Tailscale Setup (Required)

This project uses Tailscale MagicDNS for all networking. Every service (API, website, mobile) communicates over your Tailscale hostname with a real HTTPS certificate. There is no localhost fallback.

### 1. Install and sign in to Tailscale

Download from [tailscale.com](https://tailscale.com) and sign in on your development machine and any devices you want to test on.

### 2. Find your MagicDNS hostname

In the Tailscale admin console or app, find your machine's MagicDNS name. It will look like:

```
your-machine-name.tail123456.ts.net
```

### 3. Generate the HTTPS certificate

Run this in an **elevated PowerShell** (Run as Administrator):

```powershell
cd certs
tailscale cert your-machine-name.tail123456.ts.net
```

This places two files in the `certs/` folder:

- `your-machine-name.tail123456.ts.net.crt`
- `your-machine-name.tail123456.ts.net.key`

> The cert is valid for 90 days. Re-run the same command to renew it.

### 4. Configure environment files

Update the env files with your hostname:

**`Website/.env.development`**

```
VITE_TAILSCALE_HOST=your-machine-name.tail123456.ts.net
VITE_API_BASE_URL=https://your-machine-name.tail123456.ts.net:7000/api
```

**`Mobile/.env.development`**

```
EXPO_PUBLIC_API_BASE_URL=https://your-machine-name.tail123456.ts.net:7000/api
```

**`Mobile/package.json`** — update the `dev` script:

```json
"dev": "set REACT_NATIVE_PACKAGER_HOSTNAME=your-machine-name.tail123456.ts.net && expo start"
```

**`WebServer/Hobbyist.Api/appsettings.Development.json`** — update `ClientOrigin.Address` and the `Kestrel` cert paths:

```json
{
  "ClientOrigin": {
    "Name": "Development",
    "Address": "https://your-machine-name.tail123456.ts.net:3000"
  },
  "Kestrel": {
    "Endpoints": {
      "Https": {
        "Url": "https://0.0.0.0:7000",
        "Certificate": {
          "Path": "../../certs/your-machine-name.tail123456.ts.net.crt",
          "KeyPath": "../../certs/your-machine-name.tail123456.ts.net.key"
        }
      }
    }
  }
}
```

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Eri-py/Hobbyist.git
cd Hobbyist
```

### 2. Copy and Edit Config Files

Run the following script to copy all required config templates into place:

```bash
pnpm exec node Scripts/copy-configs.js
```

Then edit these files to fill in your own values:

- `WebServer/Hobbyist.Api/appsettings.Development.json`
- `Website/.env.development`
- `Mobile/.env.development`

You must update the Tailscale hostname and any secrets as described above.

### 3. Install Dependencies

```bash
# Install all workspace dependencies
pnpm install
```

This will install dependencies for the entire monorepo, including Mobile, Website, and all shared packages.

## Database Setup

### 1. Start PostgreSQL Container

```bash
docker run --name hobbyist-postgres -e POSTGRES_PASSWORD=your_password -e POSTGRES_DB=hobbyist -p 5432:5432 -d postgres:latest
```

### 2. Configure Connection String

Create the development configuration file:

```bash
# Copy the example configuration file
cp Setup/appsettings.Development.Example.json WebServer/Hobbyist.Api/appsettings.Development.json
```

Update the connection string in `WebServer/Hobbyist.Api/appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=hobbyist;Username=postgres;Password=your_password"
  }
}
```

### 3. Apply Migrations

```bash
# Install EF Core tools (if not already installed)
dotnet tool install --global dotnet-ef

# Navigate to API project
cd WebServer/Hobbyist.Api

# Create and apply migrations
dotnet ef database update
```

## Backend Setup (.NET API)

### Configuration

The backend requires configuration for:

- **Database**: PostgreSQL connection string
- **JWT**: Secret key for token signing (minimum 32 characters)
- **Email**: Mailtrap credentials for OTP delivery
- **CORS**: Allowed origins for web and mobile clients

Update `WebServer/Hobbyist.Api/appsettings.Development.json` with your credentials.

### Running the Backend

```bash
# From project root
cd WebServer/Hobbyist.Api

# Run the API
dotnet run
```

The API will be available at:

- **HTTPS**: `https://your-machine-name.tail123456.ts.net:7000`
- **API Docs**: `https://your-machine-name.tail123456.ts.net:7000/scalar/v1`

## Website Setup (React Web App)

### Running the Website

```bash
# From project root, run:
pnpm dev:web

# Or manually:
cd Website
pnpm dev
```

The website will be available at `https://your-machine-name.tail123456.ts.net:3000`.

### Configuration

The web app reads its API URL from the environment. Set `VITE_API_BASE_URL` in `Website/.env.development` — see [Tailscale Setup](#tailscale-setup-required) above.

Authentication uses HTTP-only cookies for secure token storage.

## Mobile Setup (React Native with Expo)

### Understanding the Dev Script

The mobile dev script sets the Metro bundler hostname so your phone can find the JS bundle over Tailscale:

```json
"dev": "set REACT_NATIVE_PACKAGER_HOSTNAME=your-machine-name.tail123456.ts.net && expo start"
```

Update the hostname to match your own Tailscale machine name — see [Tailscale Setup](#tailscale-setup-required).

> `set` is a Windows command. On Mac/Linux use: `REACT_NATIVE_PACKAGER_HOSTNAME=your-machine-name.tail123456.ts.net expo start`

### Running the Mobile App

```bash
# From project root
pnpm dev:mobile

# Or manually:
cd Mobile
pnpm dev
```

**To test on a physical device:**

1. Install Expo Go app on your phone
2. Scan the QR code shown in the terminal
3. Ensure your device can reach the Tailscale IP (or is on the same network)

### Configuration

The mobile app reads its API URL from the environment. Set `EXPO_PUBLIC_API_BASE_URL` in `Mobile/.env.development` — see [Tailscale Setup](#tailscale-setup-required) above.

## Development Workflow

### Run Everything

```bash
# Start web and mobile dev servers simultaneously
pnpm dev

# Or start them individually:
pnpm dev:web
pnpm dev:mobile
```

### Other Commands

```bash
# Type checking across all projects
pnpm typecheck

# Linting and fixing
pnpm lint
pnpm lint:fix

# Build for production
pnpm build

# Generate TypeScript types from OpenAPI schema (requires backend running)
pnpm generate-types

# Clean all node_modules and build artifacts
pnpm clean

# Clean and reinstall
pnpm reset
```

## Network Configuration

This project involves multiple services communicating with each other. Understanding the network configuration is crucial when making changes.

### Default Ports

| Service             | Port | URL                                                |
| ------------------- | ---- | -------------------------------------------------- |
| Backend API (HTTPS) | 7000 | `https://your-machine-name.tail123456.ts.net:7000` |
| PostgreSQL Database | 5432 | `localhost:5432`                                   |
| Website (Vite)      | 3000 | `https://your-machine-name.tail123456.ts.net:3000` |
| Expo Metro Bundler  | 8081 | `https://your-machine-name.tail123456.ts.net:8081` |

### Connection Dependencies

Understanding how services connect helps when you need to change ports or IPs:

```
Mobile App → Backend API
├─ Mobile/.env.development
│  └─ EXPO_PUBLIC_API_BASE_URL = "https://your-machine.tail123456.ts.net:7000/api"
│
└─ Mobile/package.json (dev script)
   └─ REACT_NATIVE_PACKAGER_HOSTNAME = your-machine.tail123456.ts.net

Website → Backend API
└─ Website/.env.development
   └─ VITE_API_BASE_URL = "https://your-machine.tail123456.ts.net:7000/api"

Backend API → Database
└─ WebServer/Hobbyist.Api/appsettings.Development.json
   └─ ConnectionStrings.Development

Backend API ← Allowed Origins (CORS)
└─ WebServer/Hobbyist.Api/appsettings.Development.json
   └─ ClientOrigin.Address
```

### Platform-Specific Headers

The backend identifies clients using the `Platform` header:

- **Web**: `Platform: "web"` → Uses HTTP-only cookies for auth
- **Mobile**: `Platform: "mobile"` → Returns JSON tokens for secure storage

These are automatically set in:

- `Website/src/api/axiosInstance.ts`
- `Mobile/src/api/axiosInstance.ts`

## Networking Setup with Tailscale

All services communicate exclusively over Tailscale MagicDNS with a real HTTPS certificate. This means:

- Any device on your Tailscale network can open the website or make API calls
- No `localhost` fallback exists — this is intentional
- The cert is tied to your machine's MagicDNS hostname and is valid for 90 days

See [Tailscale Setup](#tailscale-setup-required) for full configuration steps.

## API Documentation

When the backend is running, visit `https://your-machine-name.tail123456.ts.net:7000/scalar/v1` for interactive API documentation.

The documentation is auto-generated from the OpenAPI schema and allows you to test endpoints directly from the browser.

## Troubleshooting

### Backend Issues

**Database Connection Errors:**

- Ensure Docker PostgreSQL container is running: `docker ps`
- Verify connection string matches your PostgreSQL credentials
- Check if port 5432 is available

**Migration Issues:**

- Delete `WebServer/Hobbyist.Api/Migrations/` folder
- Run `dotnet ef migrations add InitialCreate` to recreate
- Run `dotnet ef database update` to apply

**SSL Certificate Errors:**

Ensure you have generated the Tailscale cert and placed it in the `certs/` folder:

```powershell
cd certs
tailscale cert your-machine-name.tail123456.ts.net
```

The cert expires every 90 days — re-run the same command to renew.

### Mobile Issues

**Cannot Connect to Dev Server:**

- Verify Tailscale is running on both your development machine and the device
- Confirm the hostname in `Mobile/.env.development` matches your machine's MagicDNS name
- Ensure the Tailscale cert is present in `certs/` and hasn't expired

### Web Issues

**Port Conflicts:**

- Vite will suggest alternative ports if 3000 is taken
- Update CORS configuration in backend if you change ports

**Cookie/Authentication Issues:**

- Ensure `withCredentials: true` is set in axios instance
- Verify CORS allows credentials from the frontend origin
- Check that cookies are being set in browser DevTools

### Workspace Issues

**Shared Package Not Found:**

```bash
pnpm install
```

**Type Errors After API Changes:**

```bash
pnpm generate-types
```

> Requires the backend to be running over Tailscale HTTPS.

## Project Status

### Implemented Features

- Multi-platform authentication (web and mobile)
- OTP email verification
- JWT token management with refresh tokens
- Responsive navigation (desktop/mobile/tablet)
- Secure token storage (cookies for web, SecureStore for mobile)

### In Progress

- User profile management
- Content creation system

### Planned

- Trading system
- Events and community features
- Real-time messaging
- Search and discovery

## Contributing

Contributions are welcome. Please follow the existing code style and ensure all tests pass before submitting pull requests.

## License

[License information to be added]
