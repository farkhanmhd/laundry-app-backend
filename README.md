# Laundry Backend

Elysia + Bun backend for the laundry app. Uses PostgreSQL (Drizzle ORM), better-auth, and Midtrans.

## Prerequisites

- [Bun](https://bun.sh) >= 1.3
- PostgreSQL running locally (default: `postgres://developer:developer@localhost:5432/laundry_app`)

## Setup

Install dependencies:

```bash
bun install
```

## Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.development   # for development
cp .env.example .env.production    # for production
```

Bun automatically loads the env file that matches the current `NODE_ENV`:

- `NODE_ENV=development` -> `.env.development`
- `NODE_ENV=production` -> `.env.production`

All files are gitignored. See `.env.example` for the required variables:

| Variable | Description |
| --- | --- |
| `APP_PORT` | Backend server port (default `3001`) |
| `FRONTEND_URL` | Frontend app URL (allowed origin) |
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Secret for signing auth tokens |
| `BETTER_AUTH_URL` | Public backend URL used by auth |
| `MIDTRANS_CLIENT_KEY` | Midtrans sandbox/production client key |
| `MIDTRANS_SERVER_KEY` | Midtrans server key |
| `MIDTRANS_URL` | Midtrans API URL (e.g. `https://app.sandbox.midtrans.com`) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `SUPERADMIN_EMAIL` | Email seeded as superadmin on first run |
| `COOKIE_DOMAIN` | Cookie domain for auth (leading dot to share across subdomains) |

> `drizzle.config.ts` reads `DATABASE_URL` from the env file. Since it runs outside the app's `NODE_ENV` context, always prefix migration commands with `NODE_ENV=development` (or `NODE_ENV=production`).

## Database Migrations

Schema lives in `src/db/schema`. Workflow:

1. **Generate** a new migration from schema changes:

```bash
NODE_ENV=development bun run drizzle:generate
```

2. **Review** the generated SQL in the `drizzle/` folder.

3. **Apply** pending migrations to the database:

```bash
NODE_ENV=development bun run drizzle:migrate
```

Other useful commands:

```bash
bun run drizzle:studio        # open Drizzle Studio (browser-based DB browser)
NODE_ENV=production bun run drizzle:migrate   # apply migrations on production
```

## Development

```bash
bun run dev
```

Starts the server in watch mode on `http://localhost:3001`.

## Build & Start

```bash
bun run build   # compiles a standalone binary to ./server
bun run start   # runs the compiled ./server binary
```

Run the production binary with the production env file:

```bash
NODE_ENV=production ./server
```
