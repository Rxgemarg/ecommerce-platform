# E-Commerce Platform

Production-ready e-commerce platform with dynamic product types and admin dashboard.

## Architecture

- **Monorepo**: pnpm + Turborepo
- **API**: NestJS + Prisma + PostgreSQL
- **Storefront**: Next.js App Router + Tailwind + shadcn/ui
- **Admin**: Next.js App Router + Tailwind + shadcn/ui
- **Packages**: Shared UI components, config, validators

## Features

### Core Features
- 🛒 **Dynamic Product Types**: Create custom product schemas via admin dashboard
- 📦 **Product Management**: Full CRUD with variants and inventory
- 🛍️ **Storefront**: SEO-optimized product catalog with faceted search
- 🎛️ **Admin Dashboard**: Comprehensive management interface
- 🔐 **Security First**: RBAC, audit logs, input validation, CSRF protection

### Security Features
- Session-based authentication with CSRF protection
- Role-based access control (RBAC)
- Input validation with Zod schemas
- Rate limiting on critical endpoints
- File upload security
- Security headers (CSP, HSTS, etc.)

## Quick Start

### Prerequisites
- Node.js 20+
- pnpm 8+
- Docker & Docker Compose

### Installation

```bash
# Clone and install dependencies
git clone <repository-url>
cd ecommerce-platform
pnpm install
```

### Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# At minimum, update DATABASE_URL and secrets
```

### Database Setup

```bash
# Start PostgreSQL
docker compose up -d postgres

# Run database migrations
pnpm db:push
```

### Development

```bash
# Start all applications in development mode
pnpm dev
```

Applications will be available at:
- **API**: http://localhost:3001
- **Storefront**: http://localhost:3000  
- **Admin**: http://localhost:3002

## Commands

```bash
# Install dependencies
pnpm install

# Development
pnpm dev              # Start all apps
pnpm dev:api          # Start API only
pnpm dev:storefront   # Start storefront only
pnpm dev:admin        # Start admin only

# Build
pnpm build            # Build all apps
pnpm build:api        # Build API only
pnpm build:storefront # Build storefront only
pnpm build:admin      # Build admin only

# Database
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema to database
pnpm db:migrate       # Run migrations

# Code Quality
pnpm lint             # Lint all packages
pnpm test             # Run all tests
pnpm type-check       # Type check all packages
```

## Project Structure

```
├── apps/
│   ├── api/          # NestJS backend API
│   ├── storefront/   # Public e-commerce frontend
│   └── admin/        # Admin dashboard
├── packages/
│   ├── ui/           # Shared UI components
│   ├── config/       # ESLint/TSConfig shared configs
│   └── validators/   # Shared Zod schemas
├── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## Development Workflow

1. **Create Product Type**: In admin dashboard, define custom fields for your product type
2. **Add Products**: Use the dynamic forms to add products with your custom attributes
3. **Configure Facets**: Set which fields appear as filters in the storefront
4. **Launch**: Products automatically appear in storefront with proper filtering

## Security Notes

- All sensitive endpoints require authentication and proper permissions
- Input validation is enforced on both client and server
- Session cookies are HttpOnly, Secure, and SameSite=Lax
- CSRF protection is enabled for state-changing requests
- File uploads are validated for type, size, and content
- No secrets are stored in the repository

## Contributing

1. Follow conventional commit messages
2. Run `pnpm lint` and `pnpm test` before committing
3. Ensure all security requirements are met
4. Update documentation for new features

## License

MIT