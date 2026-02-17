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
- **Tailscale**: VPN for device-to-device communication (bypasses network restrictions)

## Prerequisites

- **Node.js**: 24.x or higher
- **pnpm**: 10.x or higher (package manager)
- **.NET SDK**: 9.0 or higher
- **Docker**: For PostgreSQL database
- **Tailscale**: (Optional) For cross-device development

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Eri-py/Hobbyist.git
cd Hobbyist
```

### 2. Install Dependencies

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

- **HTTPS**: `https://localhost:7000`
- **HTTP**: `http://localhost:5000`
- **API Docs**: `https://localhost:7000/scalar/v1`

## Website Setup (React Web App)

### Running the Website

```bash
# From project root, run:
pnpm dev:web

# Or manually:
cd Website
pnpm dev
```

The website will be available at `http://localhost:3000`.

### Configuration

The web app connects to the backend API. The base URL is configured in `Website/src/api/axiosInstance.ts`:

```typescript
const API_BASE_URL = "https://localhost:7000/api";
```

Authentication uses HTTP-only cookies for secure token storage.

## Mobile Setup (React Native with Expo)

### Understanding the Dev Script

The mobile dev script includes a special environment variable:

```json
"dev": "set REACT_NATIVE_PACKAGER_HOSTNAME=100.85.42.14 && expo start"
```

**Why this is needed:**

- `set` is a Windows command to set environment variables for the current session
- `REACT_NATIVE_PACKAGER_HOSTNAME` tells Expo which IP address to use for the dev server
- The IP address `100.85.42.14` is a Tailscale IP that allows devices to connect across networks
- This bypasses school or corporate network restrictions that block direct device-to-device communication

**For your setup:**

1. **If you have no network restrictions:** Remove the set command entirely and just use `expo start`
2. **If using Tailscale:** Replace `100.85.42.14` with your own Tailscale laptop IP (find it in the Tailscale app)
3. **If on restricted network without Tailscale:** Set it to your local network IP (e.g., `192.168.1.100`)
   - Find your IP with `ipconfig` (Windows) or `ifconfig` (Mac/Linux)

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

The mobile app connects to the backend API. The base URL is configured in `Mobile/src/api/axiosInstance.ts`:

```typescript
const API_BASE_URL = "http://100.85.42.14:7001/api";
```

Update this IP to match your setup:

- Use your Tailscale IP if using Tailscale
- Use your local network IP if on the same network
- Update the port if your backend runs on a different port

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

| Service             | Port | URL                      |
| ------------------- | ---- | ------------------------ |
| Backend API (HTTPS) | 7000 | `https://localhost:7000` |
| Backend API (HTTP)  | 5000 | `http://localhost:5000`  |
| PostgreSQL Database | 5432 | `localhost:5432`         |
| Website (Vite)      | 3000 | `http://localhost:3000`  |
| Expo Metro Bundler  | 8081 | `http://localhost:8081`  |

### Connection Dependencies

Understanding how services connect helps when you need to change ports or IPs:

```
Mobile App → Backend API
├─ Mobile/src/api/axiosInstance.ts
│  └─ API_BASE_URL = "http://100.85.42.14:7001/api"
│
└─ Mobile/package.json (dev script)
   └─ REACT_NATIVE_PACKAGER_HOSTNAME = 100.85.42.14

Website → Backend API
└─ Website/src/api/axiosInstance.ts
   └─ API_BASE_URL = "https://localhost:7000/api"

Backend API → Database
└─ WebServer/Hobbyist.Api/appsettings.Development.json
   └─ ConnectionStrings.DefaultConnection

Backend API ← Allowed Origins (CORS)
└─ WebServer/Hobbyist.Api/appsettings.Development.json
   └─ ClientOrigin.Local (web)
   └─ ClientOrigin.Network (mobile if needed)
```

### Platform-Specific Headers

The backend identifies clients using the `Platform` header:

- **Web**: `Platform: "web"` → Uses HTTP-only cookies for auth
- **Mobile**: `Platform: "mobile"` → Returns JSON tokens for secure storage

These are automatically set in:

- `Website/src/api/axiosInstance.ts`
- `Mobile/src/api/axiosInstance.ts`

## Networking Setup with Tailscale

Tailscale creates a private VPN network between your devices, useful when:

- Your school/corporate network blocks direct device connections
- You want to test on devices not on the same WiFi
- You need consistent IPs across different networks

### Setup Steps

1. Install Tailscale on your development machine and test devices
2. Sign in to the same Tailscale account on all devices
3. Find your development machine's Tailscale IP (usually starts with `100.`)
4. Update the mobile app's API base URL to use this IP
5. Update the dev script's `REACT_NATIVE_PACKAGER_HOSTNAME` to use this IP

## API Documentation

When the backend is running, visit `https://localhost:7000/scalar/v1` for interactive API documentation.

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

```bash
dotnet dev-certs https --trust
```

### Mobile Issues

**Cannot Connect to Dev Server:**

- Verify the IP in the dev script matches your current setup
- Check that Tailscale is running (if using Tailscale)
- Try using local network IP instead
- Ensure firewall allows connections on the Metro bundler port

**"set" Command Not Found:**

- The script uses Windows `set` command
- On Mac/Linux, change to: `REACT_NATIVE_PACKAGER_HOSTNAME=100.85.42.14 expo start`
- Or create platform-specific scripts

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
