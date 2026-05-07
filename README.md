# Performance Review App

CySeck is a fullstack employee performance review system. Admins manage employees and review cycles; employees submit peer feedback. The entire application is a single Next.js 16 process, no separate backend service.

## Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 16 (App Router) | Pages + API routes in one process |
| Language | TypeScript 5 (strict) | `strict: true`, `noEmit` for type checking |
| Database | PostgreSQL 16 | Hosted in Docker or externally |
| ORM | Prisma 7 | Driver adapter mode (`PrismaPg`) |
| Auth | JWT via `jose` | HS256, stored in httpOnly cookie |
| Passwords | `bcryptjs` | 10 salt rounds |
| Styling | Tailwind CSS 4 | No config file; `@import "tailwindcss"` |
| Runtime | Node.js 18+ | Docker or local |

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

## Project Structure

```
├── app/
│   ├── layout.tsx                   # Root layout — mounts NavBar
│   ├── page.tsx                     # Auth-aware redirect (/, → login/admin/employee)
│   ├── globals.css                  # Design tokens (CSS vars), body font
│   ├── NavBar.tsx                   # Sticky nav — user name, role badge, sign out
│   ├── login/page.tsx               # Login form
│   ├── admin/
│   │   ├── page.tsx                 # Dashboard: Employees tab + Reviews tab
│   │   └── reviews/[id]/page.tsx   # Review detail + edit form + feedback list
│   ├── employee/page.tsx            # Pending assignments + feedback submission
│   └── api/
│       ├── auth/login/route.ts      # POST — authenticate, issue JWT
│       ├── auth/logout/route.ts     # POST — clear JWT cookie
│       ├── auth/me/route.ts         # GET — current user from JWT + DB
│       ├── employees/route.ts       # GET list / POST create
│       ├── employees/[id]/route.ts  # PUT update / DELETE remove
│       ├── reviews/route.ts         # GET list|pending / POST create
│       ├── reviews/[id]/route.ts    # PUT update (period, status, reviewers)
│       └── feedback/route.ts        # POST submit feedback
├── lib/
│   ├── auth.ts                      # signJWT / verifyJWT / getCurrentUser
│   └── prisma.ts                    # Singleton PrismaClient (dev HMR safe)
├── prisma/
│   ├── schema.prisma                # Data models
│   └── seed.ts                      # Initial employees + sample reviews
├── proxy.ts                         # Next.js middleware — JWT + role guard
├── prisma.config.ts                 # Prisma 7 datasource + seed config
├── docker-compose.yml
├── Dockerfile
└── docker-entrypoint.sh
```

## Data Model

```
Employee
  id          cuid (PK)
  email       String (unique)
  name        String
  password    String (bcrypt hash)
  role        Role (admin | employee)
  createdAt   DateTime

Review
  id          cuid (PK)
  employeeId  FK → Employee (the subject being reviewed)
  period      String (e.g. "Q1 2026")
  status      ReviewStatus (open | closed)
  createdAt   DateTime

ReviewAssignment
  id          cuid (PK)
  reviewId    FK → Review
  reviewerId  FK → Employee (the person giving feedback)
  @@unique([reviewId, reviewerId])   -- one slot per reviewer per review

Feedback
  id           cuid (PK)
  assignmentId FK → ReviewAssignment (unique — one feedback per assignment)
  rating       Int (1–5)
  comments     String
  submittedAt  DateTime
```

**Cascade rules (all via Prisma `onDelete: Cascade`):**
- Delete `Employee` → deletes their `Review`s, `ReviewAssignment`s, and `Feedback`
- Delete `Review` → deletes its `ReviewAssignment`s and `Feedback`
- Delete `ReviewAssignment` → deletes its `Feedback`

## Authentication Flow

```
Browser                          Next.js (proxy.ts)         API Route
  │                                     │                       │
  │── POST /api/auth/login ────────────►│                       │
  │   { email, password }               │ (auth/* bypassed)     │
  │                                     │──────────────────────►│
  │                                     │                       │ findUnique by email
  │                                     │                       │ bcrypt.compare
  │                                     │                       │ signJWT → HS256
  │◄── 200 { role } + Set-Cookie ───────│◄──────────────────────│
  │    token=<jwt>; HttpOnly; SameSite=Lax; MaxAge=7d           │
  │                                     │                       │
  │── GET /admin ───────────────────────►│                       │
  │                                     │ verifyJWT(cookie)     │
  │                                     │ payload.role === admin?│
  │◄── 200 (page renders) ──────────────│                       │
```

**JWT payload:** `{ "userId": "<cuid>", "role": "admin|employee", "iat": ..., "exp": ... }`

**Token lifetime:** 7 days. No refresh. Logout clears the cookie but the token remains cryptographically valid until expiry (no server-side revocation).

## API Routes

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Validate credentials, issue JWT cookie |
| POST | `/api/auth/logout` | Public | Expire JWT cookie |
| GET | `/api/auth/me` | Any | Return `{ userId, role, name }` from DB |

### Employees

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/employees` | Admin | List all employees |
| POST | `/api/employees` | Admin | Create employee (hashed password) |
| PUT | `/api/employees/[id]` | Admin | Update name, email, role, password |
| DELETE | `/api/employees/[id]` | Admin | Delete employee + cascade |

**Admin-on-admin protection:** An admin cannot edit another admin's account. No admin account can be deleted.

### Reviews

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/reviews` | Admin | List all reviews with assignments + feedback |
| GET | `/api/reviews?id=<id>` | Admin | Single review detail |
| GET | `/api/reviews?reviewerId=<id>` | Employee (self only) | Pending open assignments |
| POST | `/api/reviews` | Admin | Create review + assignments in a transaction |
| PUT | `/api/reviews/[id]` | Admin | Update period, status, reviewers in a transaction |

### Feedback

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/feedback` | Employee | Submit rating (1–5) + comments for an assignment |

## Assumptions

1. **No self-registration** — accounts are created only by admins
2. **No password reset** — out of scope; admins can update any employee's password
3. **No self-review** — enforced server-side and in UI (subject excluded from reviewer picker)
4. **One feedback per assignment** — enforced by `@@unique([assignmentId])` DB constraint
5. **Feedback is immutable** — once submitted it cannot be edited or retracted
6. **No pagination** — designed for small teams; all lists are fetched in full
7. **Admin role is immutable** — cannot be downgraded; promoted employees become permanent admins
8. **Admin is an employee** — stored in the same table with `role = 'admin'`; admins can be assigned as reviewers
9. **Closed reviews are excluded from employee queue** — employees only see open reviews with pending assignments
10. **No email notifications** — all communication is in-app only
11. **JWT secret from environment** — use a secrets manager (Vault, AWS Secrets Manager) in production
12. **Single-tenant** — one company, one shared database, no org-level isolation

## Security Fixes (Known Issues)

### Critical

**JWT_SECRET not validated at startup** — If `JWT_SECRET` is undefined, `jose` encodes the literal string `"undefined"` as the signing key — a predictable, trivially brutable secret.
Fix: validate `process.env.JWT_SECRET` is present and has sufficient entropy at startup.

**No rate limiting on `/api/auth/login`** — The login endpoint accepts unlimited requests with no delay, lockout, or CAPTCHA.
Fix: add rate limiting middleware (e.g. Upstash Ratelimit) keyed by IP and email.

### Medium

**JWT not invalidated on logout** — The JWT remains valid for its full 7-day lifetime after logout.
Fix: maintain a server-side token denylist or switch to short-lived access tokens with a rotating refresh token.

**No HTTP security headers** — Missing `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and `Strict-Transport-Security`.
Fix: add a `headers()` export in `next.config.ts`.

**Cookie not `Secure` outside `NODE_ENV=production`** — Staging environments not explicitly set to `production` transmit the token cookie over plain HTTP.
Fix: set `Secure: true` unconditionally or via a separate `COOKIE_SECURE` env var.

### Low

**No audit logging** — Admin mutations and auth events produce no log entries.
Fix: add structured logging (e.g. Pino) on all auth events and admin mutations.

**No CSRF token** — `sameSite: 'lax'` covers most CSRF vectors but leaves a gap for same-site subdomain attacks.
Fix: add a double-submit cookie pattern or use `sameSite: 'strict'`.
