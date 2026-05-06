# Performance Review App

A fullstack employee performance review system built with Next.js, PostgreSQL, Prisma, and Tailwind CSS.

## Stack

- **Next.js 16** — App Router, TypeScript, API Routes
- **PostgreSQL 16** — via Docker
- **Prisma 7** — schema, migrations, seeding
- **Tailwind CSS 4** — styling
- **jose** — JWT auth (Edge-compatible)
- **bcryptjs** — password hashing

## Setup

### Option A — Docker (recommended)

Requires [Docker](https://docs.docker.com/get-docker/) with Compose v2.

```bash
docker compose up --build
```

Starts PostgreSQL, waits for it to be healthy, then automatically pushes the schema, seeds the database, and starts the app at **http://localhost:3001**.

### Option B — Local

Requires Node.js 18+ and a running PostgreSQL instance.

1. Set your connection string in `.env`:

```bash
cp .env.example .env
# edit .env and set DATABASE_URL to your PostgreSQL instance
# e.g. DATABASE_URL="postgresql://user:password@localhost:5432/cyseck"
```

2. Install, migrate, and start:

```bash
npm install
npm run setup
npm run dev
```

App runs at **http://localhost:3000**.

## Seed Credentials

| Email               | Password    | Role     |
|---------------------|-------------|----------|
| admin@company.com   | Cyseck@123  | Admin    |
| bob@company.com     | Cyseck@123  | Employee |
| carol@company.com   | Cyseck@123  | Employee |
| dave@company.com    | Cyseck@123  | Employee |
| eve@company.com     | Cyseck@123  | Employee |

## Pages

| Route                  | Description                                              |
|------------------------|----------------------------------------------------------|
| `/`                    | Redirects to `/login`, `/admin`, or `/employee`          |
| `/login`               | Email + password sign-in                                 |
| `/admin`               | Admin dashboard — manage employees and reviews (tabbed)  |
| `/admin/reviews/[id]`  | Review detail — feedback list, edit period/status/reviewers |
| `/employee`            | Pending review assignments with inline feedback form     |

## API Routes

| Method | Path                  | Description                                      |
|--------|-----------------------|--------------------------------------------------|
| POST   | `/api/auth/login`     | Authenticate, set JWT cookie                     |
| POST   | `/api/auth/logout`    | Clear JWT cookie                                 |
| GET    | `/api/auth/me`        | Return current user from JWT                     |
| GET    | `/api/employees`      | List all employees (admin)                       |
| POST   | `/api/employees`      | Create employee with hashed password (admin)     |
| PUT    | `/api/employees/[id]` | Update employee (admin)                          |
| DELETE | `/api/employees/[id]` | Delete employee + cascade (admin)                |
| GET    | `/api/reviews`        | List reviews (admin: all; employee: pending)     |
| POST   | `/api/reviews`        | Create review + assign reviewers (admin)         |
| PUT    | `/api/reviews/[id]`   | Update period, status, reviewers (admin)         |
| POST   | `/api/feedback`       | Submit feedback for an assignment (employee)     |

## Password Policy

Passwords must be at least 8 characters and contain at least one number and one special character. This is enforced on the client when creating or updating employees. Seed accounts use `Cyseck@123`.

## Design

- Minimalistic light-only UI (Apple / Uber aesthetic)
- System font stack (`-apple-system`, SF Pro)
- No dark mode
- Color palette: `#F5F5F7` page background, `#FFFFFF` cards, `#1D1D1F` text, `#6E6E73` muted, `#000000` primary actions
- Password fields have a show/hide toggle
- Submit buttons are disabled until required fields are filled

## Assumptions

- **No self-registration** — only admins create employee accounts with an initial password
- **No password reset** — out of scope for this demo
- **No self-review** — enforced server-side; the subject employee is excluded from reviewer selection
- **One feedback per assignment** — enforced by a DB unique constraint (`assignmentId`)
- **No pagination** — small demo dataset
- **JWT secret in `.env`** — use a proper secret manager in production
- **Admin is an employee** — `role = 'admin'` on the `Employee` table; admins can also be assigned as reviewers
- **Admin role is immutable** — an admin's role cannot be downgraded via the UI

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── auth/login, logout, me
│   │   ├── employees/, employees/[id]
│   │   ├── reviews/, reviews/[id]
│   │   └── feedback/
│   ├── admin/
│   │   ├── page.tsx              # Employees + Reviews tabs
│   │   └── reviews/[id]/page.tsx # Review detail
│   ├── employee/page.tsx         # Pending assignments + feedback form
│   ├── login/page.tsx
│   ├── NavBar.tsx
│   ├── layout.tsx
│   └── page.tsx                  # Auth redirect
├── lib/
│   ├── prisma.ts                 # Singleton PrismaClient
│   └── auth.ts                   # JWT sign/verify/getCurrentUser
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── proxy.ts                       # JWT verification + role-based route guard
├── prisma.config.ts              # Prisma 7 datasource config
└── docker-compose.yml
```
