# Hobbyist - Local Development Setup

## Project Overview

A full-stack web application for hobbyists to connect, trade, and share their interests. Built with React (frontend) and .NET (backend).

### Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Material-UI, TanStack Router, TanStack Query
- **Backend**: .NET Core 9.0, Entity Framework Core, JWT Authentication
- **Database**: SQL Server

## Development Status

### ✅ Fully Implemented

- Complete authentication system with OTP email verification
- Responsive app shell with desktop/mobile navigation

### 🚧 In Progress

- User profile page and management

### 📋 Planned Features

- Content creation and management
- Trading system between users
- Events and community features
- Real-time messaging
- Search and discovery

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Eri-py/Hobbyist.git
cd Hobbyist
```

### 2. Environment Setup

**Optional - VS Code Setup:** This project was developed entirely in VS Code, so using different IDEs might lead to unexpected issues. If you're using VS Code:

1. Open your terminal (Command Prompt or PowerShell) in the project root directory
2. Run the following command to copy vscode configuration files:

```bash
cp -r setup/.vscode .
```

## Frontend Setup (React + Vite)

### Prerequisites

- Node.js 24.x or higher (specified in package.json devEngines)

### Installation

```bash
# Navigate to the frontend directory
cd Website

# Install dependencies
npm install
```

### Development Server

```bash
# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start development server on port 3000
- `npm run build` - Build for production
- `npm run preview` - Preview production build on port 3001
- `npm run lint` - Run ESLint

## Backend Setup (.NET)

### Prerequisites

- .NET 9.0 SDK or higher
- SQL Server (LocalDB, Express, or Full version)
- An email service account (Mailtrap for development)

### Configuration Files

The project requires a development configuration file that is not included in the repository for security reasons. Copy the example file and update it with your credentials:

```bash
# Copy the example configuration file
cp Setup/appsettings.Development.Example.json ApiServer/Hobbyist.Api/appsettings.Development.json
```

Network Access Configuration
If you need to access the API from other devices on your network:

Update the `ClientOrigin.Network` IP address in appsettings.Development.json to match your local network IP

### Database Setup

1. **Install Entity Framework Tools** (if not already installed):

```bash
dotnet tool install --global dotnet-ef
```

2. **Navigate to the API project directory**:

```bash
cd ApiServer/Hobbyist.Api
```

3. **Create and apply database migrations**:

```bash
# Create initial migration (if not exists)
dotnet ef migrations add InitialCreate

# Apply migrations to create the database
dotnet ef database update
```

### API Endpoints

The API documentation is available at `https://localhost:7000/scalar/v1` when running in development mode. This provides interactive documentation for all available endpoints.

### Running the Backend

1. **Navigate to the API project directory**:

```bash
cd ApiServer/Hobbyist.Api
```

2. **Restore dependencies**:

```bash
dotnet restore
```

3. **Run the application**:

```bash
dotnet run
```

The backend API will be available at:

- **HTTPS**: `https://localhost:7000`
- **HTTP**: `http://localhost:5000`
- **API Documentation**: `https://localhost:7000/scalar/v1` (Scalar API reference)

## Default Ports

- **Frontend (React/Vite)**: `http://localhost:3000`
- **Backend API (.NET)**: `https://localhost:7000` (HTTPS) / `http://localhost:5000` (HTTP)

## Important Configuration Notes

- If you change ports in package.json or launchSettings.json, make sure to update the corresponding CORS policy in Program.cs (backend) and API_BASE_URL in Client.ts (frontend)
- The current API_BASE_URL is set to `https://localhost:7000/api` in `Website/src/api/Client.ts`
- Authentication uses HTTP-only cookies for refresh tokens and Authorization headers for access tokens

## Troubleshooting

### Frontend Issues

- **Node Version**: Ensure you're using Node.js 24.x as specified in devEngines
- **Port Conflicts**: If port 3000 is in use, Vite will automatically suggest an alternative
- **Build Errors**: Run `npm run lint` to check for code issues

### Backend Issues

- **Database Connection**: Ensure SQL Server is running and the connection string is correct
- **Migration Errors**: Try deleting the `Migrations` folder and recreating with `dotnet ef migrations add InitialCreate`
- **Email Service**: Verify Mailtrap credentials are correct in appsettings.Development.json
- **JWT Errors**: Ensure the JWT secret is at least 32 characters long
- **Port Conflicts**: If ports 5000/7000 are in use, update launchSettings.json and corresponding CORS settings
- **SSL Certificate**: Trust the development certificate with `dotnet dev-certs https --trust`

## Contributing

[PLACEHOLDER - Contributing guidelines will be added]

## License

[PLACEHOLDER - License information will be added]
