# Community Health Centre API — Backend Documentation

> Audience: **Backend developers**
> API base URL (local): `http://localhost:5000`
> Repository: https://github.com/Adigwe682/techcrush-community-health-centre
> Version: `1.0.0`

---

## Table of Contents

1. [API Endpoints](#1-api-endpoints)
2. [Login, Authentication & User Roles](#2-login-authentication--user-roles)
3. [Technologies, Dependencies & Versions](#3-technologies-dependencies--versions)
4. [Environment Variables & Database Setup](#4-environment-variables--database-setup)
5. [Running the Backend Locally](#5-running-the-backend-locally)
6. [Hosting & Deployment](#6-hosting--deployment)
7. [User Management (Create, Disable, Reset, Change Roles)](#7-user-management)
8. [Known Bugs & Limitations](#8-known-bugs--limitations)

---

## 1. API Endpoints

All endpoints are prefixed with `/api`. Protected endpoints require an
`Authorization: Bearer <token>` header. Responses are JSON.

### 1.1 Health & Documentation

| Method | Path            | Auth | Description |
|--------|-----------------|------|-------------|
| GET    | `/api/health`   | None | Service health check: status (`healthy`/`degraded`), uptime, timestamp, environment, version, database connectivity, audit-logging and notification flags. |
| GET    | `/api/docs`     | None | Self-describing API documentation payload (endpoint listing). |

### 1.2 Authentication (`/api/auth`)

| Method | Path                          | Permission Required | Description |
|--------|-------------------------------|---------------------|-------------|
| POST   | `/api/auth/login`             | None                | Authenticate with email + password; returns a JWT and a user summary. |
| POST   | `/api/auth/logout`            | Valid token         | Acknowledges logout. **Stateless** — the client must discard the token; the server does not invalidate it (see [Known Bugs](#8-known-bugs--limitations)). |
| POST   | `/api/auth/staff`             | `staff:create`      | Create a new staff account. Body: `firstName`, `lastName`, `email`, `password`, `role` (Role ObjectId). Password is hashed automatically by the `User` model pre-save hook. Returns `201`. `409` if the email already exists, `404` if the role does not exist. |
| PATCH  | `/api/auth/staff/:userId/status` | `staff:update`  | Activate or deactivate a staff account. Body: `isActive: true|false`. Returns `400` if `isActive` is not a boolean, `404` if the user does not exist. Deactivated users cannot log in and are rejected by permission checks. |

**Request example — login**

```http
POST /api/auth/login
Content-Type: application/json

{ "email": "admin@example.com", "password": "secret123" }
```

**Response `200`**

```json
{
  "message": "Login successful",
  "token": "<JWT>",
  "user": {
    "id": "<ObjectId>",
    "firstName": "Admin",
    "lastName": "User",
    "email": "admin@example.com",
    "role": "Admin"
  }
}
```

**Error responses:** `400` missing fields · `401` invalid email/password · `403` account inactive.

### 1.3 Audit Logs (`/api/audit`)

| Method | Path                  | Permission Required | Description |
|--------|-----------------------|---------------------|-------------|
| POST   | `/api/audit`          | `audit:manage`      | Create an audit log entry. Body: `entityType` (enum, e.g. `User`, `Role`, `Patient`, `Appointment`…), `entityId` (ObjectId), `action`, optional `details` (object), `ipAddress`, `userAgent`, `endpoint`, `status`. Returns `201`. |
| GET    | `/api/audit`          | Valid token         | Get **the requesting user's own** audit logs. Supports query params `page`, `limit` (default 1/50), `entityType`, `action`, `startDate`, `endDate`. Returns `data[]` + `pagination`. |
| GET    | `/api/audit/all`      | `audit:manage`      | Get **all users'** audit logs. Same filters as above, plus `user` (UserId filter). |
| GET    | `/api/audit/:id`      | `audit:manage`      | Get a single audit log by id (`404` if not found). |
| DELETE | `/api/audit/:id`      | `audit:manage`      | Delete an audit log by id (`404` if not found). |

### 1.4 Notifications (`/api/notifications`)

All notification endpoints are scoped to the **authenticated user's own**
notifications. Any authenticated user may call them (no extra permission).

| Method | Path                          | Description |
|--------|-------------------------------|-------------|
| POST   | `/api/notifications`          | Create a notification. Body: `title` (required, ≤200 chars), `message` (required), `type` (optional enum: `info`, `success`, `warning`, `error`, `system`, `login`, `logout`, `appointment_created`, … — defaults to `info`), `data` (optional object). Returns `201`. |
| GET    | `/api/notifications`          | List own notifications. Query: `page`, `limit`, `read` (`true`/`false`), `type`, `startDate`, `endDate`. |
| GET    | `/api/notifications/unread-count` | Count of unread notifications. Returns `{ data: <number> }`. |
| PATCH  | `/api/notifications/:id/read` | Mark one notification as read (sets `readAt`). `404` if not found **or owned by another user**. |
| PATCH  | `/api/notifications/read-all` | Mark all of the user's unread notifications as read. Returns `modifiedCount`. |
| DELETE | `/api/notifications/:id`      | Delete one notification. `404` if not found/foreign. |
| DELETE | `/api/notifications`          | Delete **all** of the user's notifications. Returns `deletedCount`. |

### 1.5 Error Format

Errors flow through the global error handler
(`src/middleware/errorHandler.js`):

```json
// Production (NODE_ENV != "development")
{ "status": "error" | "fail", "statusCode": 500, "message": "..." }
```

In development (`NODE_ENV=development`) the response additionally includes
`error`, `stack`, `path`, `method`, `timestamp`, and `url`.

Controller-level errors (auth, audit, notifications) return
`{ "message": "...", "error": "..." }` directly. `src/utils/errorCodes.js`
defines a standard error-code vocabulary (e.g. `INVALID_CREDENTIALS`,
`RESOURCE_NOT_FOUND`) for future use — see [Known Bugs](#8-known-bugs--limitations).

---

## 2. Login, Authentication & User Roles

### 2.1 Login flow

1. Client sends `POST /api/auth/login` with `{ email, password }`.
2. Server loads the user **with populated role** (`User.findOne({ email }).populate("role")`).
3. Checks in order: user exists → `401`; account `isActive` → `403`; password matches (bcrypt) → `401`.
4. Server signs a **JWT** and returns it with a safe user summary.

```js
jwt.sign(
  { userId: user._id, role: user.role.name },  // payload
  process.env.JWT_SECRET,
  { expiresIn: "1d" }
);
```

- **Token lifetime:** 1 day.
- **Secret:** `process.env.JWT_SECRET` (never hardcode in production).
- **Hashing:** `bcryptjs`, salt rounds = 10, applied in `src/models/User.js` `pre("save")` hook only when the password is modified.

### 2.2 Authentication middleware (`protect`)

`src/middleware/authMiddleware.js` exports three middlewares:

- **`protect`** — requires `Authorization: Bearer <token>`; verifies the JWT with
  `JWT_SECRET`; stores the decoded payload on `req.user` (`{ userId, role, iat, exp }`).
  Returns `401` for missing/malformed/invalid/expired tokens.
- **`authorize(...roles)`** — role-name check against `req.user.role`
  (available, but currently unused by any route).
- **`authorizePermission(permissionName)`** — permission-based RBAC. Loads
  `User → Role → Permissions` (two-level populate), then checks
  `user.role.permissions` for an exact name match (e.g. `staff:create`).
  Returns `403` if the user is inactive, has no role, or lacks the permission.

### 2.3 Roles & permissions model

- **Permission** (`src/models/Permission.js`): `{ name (unique), description }` — names are colon-separated `resource:action` strings.
- **Role** (`src/models/Role.js`): `{ name (unique), description, permissions: [ObjectId] }`.
- **User** (`src/models/User.js`): references a single Role.

Seeded by `npm run seed` (`src/config/seedRBAC.js`):

| Role | Summary of permissions |
|------|------------------------|
| **Admin** | All `staff:*`, `patient:*`, `appointment:*`, `queue:manage`, `clinical:*`, `billing:*`, `payment:create`, `receipt:create`, `reports:view`, `audit:manage`, `notification:read` |
| Receptionist | `patient:create/view/update`, `appointment:create/view/update`, `queue:manage`, `vitals:create`, `billing:view` |
| Nurse | `patient:view/update`, `appointment:view`, `queue:manage`, `vitals:create`, `clinical:view/create` |
| Doctor | `patient:view`, `appointment:view`, `queue:manage`, `clinical:view/create`, `diagnosis:create`, `prescription:create` |
| Cashier | `patient:view`, `billing:create/view`, `payment:create`, `receipt:create` |

Full permission list: `staff:create|view|update`, `patient:create|view|update`,
`appointment:create|view|update`, `queue:manage`, `vitals:create`,
`clinical:view|create`, `diagnosis:create`, `prescription:create`,
`billing:create|view`, `payment:create`, `receipt:create`, `reports:view`,
`audit:manage`, `notification:read`.

> **Important:** the JWT embeds the role **name** (`role: "Admin"`). The
> `authorizePermission` middleware, however, re-reads the user's role from the
> database on every request, so role changes take effect immediately — a user
> cannot escalate privileges by keeping an old token, and deactivated accounts
> are blocked even with a valid token.

### 2.4 Activity logging

`src/middleware/activityLogMiddleware.js` is mounted globally in `app.js` and
attempts to write an `AuditLog` entry for every non-public request. It is
**currently broken** (see [Known Bugs](#8-known-bugs--limitations)).

---

## 3. Technologies, Dependencies & Versions

### Runtime

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | v22.18.0 (developed/tested) | Runtime |
| **Express** | `^5.2.1` (v5!) | HTTP framework — note Express 5 has breaking changes vs 4 (async error handling, route syntax) |
| **Mongoose** | `^9.10.3` | MongoDB ODM (bundles **mongodb driver 7.6.0**) |
| **bcryptjs** | `^3.0.3` | Password hashing |
| **jsonwebtoken** | `^9.0.3` | JWT signing/verification |
| **cors** | `^2.8.6` | Cross-origin support (currently wide open) |
| **dotenv** | `^18.0.5` | `.env` loading |

### Development / Testing

| Technology | Version | Purpose |
|------------|---------|---------|
| **jest** | `^30.5.2` | Test runner (`testEnvironment: node`, `forceExit`, 10s timeout) |
| **supertest** | `^7.0.0` | HTTP assertions against an in-test Express app |
| **mongodb-memory-server** | `^11.3.0` | In-memory MongoDB (mongod `8.2.6`, cached in `node_modules/.cache/mongodb-memory-server/`) for integration tests — no external DB needed |
| **nodemon** | `^3.1.14` | Dev auto-restart |

`package.json` scripts: `start`, `dev`, `seed`, `test`, `test:watch`, `test:coverage`.
Package type: **CommonJS** (`"type": "commonjs"`).

---

## 4. Environment Variables & Database Setup

### 4.1 Environment variables (`.env` in project root)

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `MONGO_URI` | Yes | `mongodb://localhost:27017/community_health_centre` | MongoDB connection string used by `app.js` and the seed script. |
| `JWT_SECRET` | Yes | *(strong random string)* | Secret used to sign/verify JWTs. |
| `PORT` | No (default `5000`) | `5000` | HTTP port. |

Optional flags read by controllers/health check (no need to set explicitly):

| Variable | Effect when set | Default behaviour |
|----------|-----------------|-------------------|
| `NODE_ENV` | `development` → verbose error responses; `test` → set automatically by the test setup | `production`-style minimal errors |
| `AUDIT_ENABLED` | `"false"` disables the audit-logging flag reported by `/api/health` | enabled |
| `NOTIFICATION_ENABLED` | `"false"` disables the notification flag reported by `/api/health` | enabled |
| `BASE_URL` | Used in `/api/docs` output | `http://localhost:5000` |

Test-only variables set automatically by `jest.setup.js`:
`MONGO_URI` (pointing at the in-memory server), `JWT_SECRET=test-secret-key`,
`NODE_ENV=test`, `AUDIT_ENABLED=true`, `NOTIFICATION_ENABLED=true`, and
`MONGOMS_SYSTEM_BINARY` (path to the cached mongod binary).

> `.env` is git-ignored. Never commit real secrets; create the file locally
> (see [§5](#5-running-the-backend-locally)).

### 4.2 Database setup

- **Database:** MongoDB (any ≥ 6.x; tests use mongod 8.2.6). Works with a local
  install, Docker, or MongoDB Atlas — anything reachable via `MONGO_URI`.
- **ODM:** Mongoose 9. Schemas in `src/models/`: `User`, `Role`, `Permission`,
  `AuditLog`, `Notification`.
- **Seed the RBAC data** (permissions + roles) once per database:

  ```bash
  npm run seed    # runs src/config/seedRBAC.js — idempotent, safe to re-run
  ```

  The seed script upserts permissions/roles (existing ones are updated, not
  duplicated), then disconnects and exits.
- **Indexes:** `AuditLog` has indexes on `{ user, createdAt }`,
  `{ entityType, entityId, createdAt }`, `{ createdAt }`; `Notification` on
  `{ user, read, createdAt }` and `{ user, createdAt }`; `User.email` and
  `Role.name`/`Permission.name` are unique.
- **Tests:** do **not** need a running MongoDB — `jest.setup.js` boots an
  in-memory MongoDB via `mongodb-memory-server` (using the cached mongod
  binary at `node_modules/.cache/mongodb-memory-server/mongod-x64-win32-8.2.6.exe`)
  and connects Mongoose to it, then tears everything down afterwards.

---

## 5. Running the Backend Locally

**Prerequisites:** Node.js ≥ 20 (developed on v22.18.0), npm, and a MongoDB
instance (local, Docker, or Atlas).

```bash
# 1. Clone and install
git clone https://github.com/Adigwe682/techcrush-community-health-centre.git
cd techcrush-community-health-centre
npm install

# 2. Configure environment
#    Create a .env file in the project root:
#      MONGO_URI=mongodb://localhost:27017/community_health_centre
#      JWT_SECRET=<generate-a-strong-secret>
#      PORT=5000

# 3. Seed roles & permissions (requires MONGO_URI to be reachable)
npm run seed

# 4a. Start in development mode (auto-restart on changes)
npm run dev

# 4b. Or start in production mode
npm start
```

Verify:

- `GET http://localhost:5000/api/health` → `status: "healthy"` and
  `database.status: "connected"`.
- `POST http://localhost:5000/api/auth/login` with a seeded user's credentials.

### Running tests

```bash
npm test            # integration suite (27 tests) — boots its own in-memory MongoDB
npm run test:watch  # watch mode
npm run test:coverage
```

Test notes for developers:

- Integration tests live in `src/tests/integration.test.js` and use **supertest**
  against a small Express app assembled in-test from the real routes
  (`authRoutes`, `auditLogRoutes`, `notificationRoutes`, `healthController`)
  plus the real 404/error handlers.
- `jest.setup.js` exports `setupTestDB`, `teardownTestDB`, `cleanupDB`.
  **Quirk (important):** the mongodb driver 7.x loads its `os` runtime adapter
  via dynamic `import()`, which fails silently inside Jest's CJS sandbox and
  breaks the handshake. The setup therefore passes
  `runtimeAdapters: { os }` to `mongoose.connect(...)`. If you write new
  connection code for tests, do the same.
- JWTs in tests are signed manually with `process.env.JWT_SECRET`
  (`test-secret-key`) and a payload of `{ userId, role, email }`.

---

## 6. Hosting & Deployment

**Current state: not deployed.** The repository
(`https://github.com/Adigwe682/techcrush-community-health-centre`) has **no
deployment configuration** — no Dockerfile, no CI/CD workflows (`.github/`),
no Procfile/render.yaml/Fly.io/Railway config. The backend is expected to run
on any Node.js host (local machine, university server, or a PaaS).

### Recommended deployment outline

1. **Host:** any Node ≥ 20 platform — Render, Railway, Fly.io, AWS (ECS/EC2),
   Azure App Service, or a VM with PM2.
2. **Database:** MongoDB Atlas (free M0 tier is sufficient to start) or a
   managed MongoDB; set `MONGO_URI` to the Atlas connection string.
3. **Secrets:** set `MONGO_URI`, `JWT_SECRET`, `PORT` (or let the platform
   assign one and read `process.env.PORT`), `NODE_ENV=production` as platform
   environment variables — **do not** ship the `.env` file.
4. **Build steps:** `npm ci` → `npm run seed` (once) → `npm start`
   (`node src/app.js`). The app connects to MongoDB and starts listening in
   `src/app.js` on boot.
5. **Health checks:** point the platform's health probe at `GET /api/health`.
6. **TLS:** terminate HTTPS at the platform/reverse proxy; JWTs must only ever
   travel over HTTPS.

### Suggested Dockerfile (not yet in the repo)

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY src ./src
ENV NODE_ENV=production
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s \
  CMD wget -qO- http://127.0.0.1:5000/api/health || exit 1
CMD ["node", "src/app.js"]
```

### Current Git layout

- `main` — last deployed/reference branch: *Implement authentication and RBAC*.
- `Audit-+-Notifications-+-Integration/Testing` — active feature branch with
  audit logs, notifications, and the integration test suite.

---

## 7. User Management

All user-management operations require a valid JWT plus the listed permission,
and **only the seeded roles** (seed with `npm run seed`) grant them.

### 7.1 Create a user (staff account)

```http
POST /api/auth/staff
Authorization: Bearer <admin-token>   # role must have "staff:create"
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Nurse",
  "email": "jane@example.com",
  "password": "secret123",
  "role": "6650f0e2a1b2c3d4e5f60789"   # ObjectId of a Role document
}
```

- Password is hashed automatically (`pre("save")` hook, bcrypt, 10 rounds,
  minimum length 6 enforced by the schema).
- `201` on success; `409` duplicate email; `404` unknown role; `400` missing fields.
- To look up a Role id: `db.roles.find()` in mongosh, or query the `roles`
  collection via your DB client.

### 7.2 Disable / enable a user

```http
PATCH /api/auth/staff/<userId>/status
Authorization: Bearer <token with "staff:update">
Content-Type: application/json

{ "isActive": false }
```

- `400` if `isActive` is not a boolean; `404` if the user does not exist.
- A deactivated user **cannot log in** (`403 Account is inactive`) and is
  rejected at the `authorizePermission` middleware even with a valid token
  (`403 Account is inactive`). Re-enable with `{ "isActive": true }`.

### 7.3 Reset a password

**No API endpoint exists** (see Known Bugs). Options today:

1. **Direct DB update** (temporary password; user must change it):

   ```js
   // mongosh
   const bcrypt = require("bcryptjs");
   db.users.updateOne(
     { email: "jane@example.com" },
     { $set: { password: bcrypt.hashSync("TempPass123!", 10) } }
   );
   ```

   The `pre("save")` hook only runs on document saves through Mongoose, so if
   you update via `mongosh` you must hash manually (as above). If you update
   through Mongoose (`User.findOne(...); user.password = "new"; await user.save()`),
   hashing is automatic.
2. **Recommended:** implement `POST /api/auth/reset-password` with a
   signed, short-lived reset token emailed to the user (work item — see
   Known Bugs).

### 7.4 Change a user's role

**No API endpoint exists.** Change directly in the database:

```js
// mongosh — grant the "Doctor" role
const doctor = db.roles.findOne({ name: "Doctor" });
db.users.updateOne({ email: "jane@example.com" }, { $set: { role: doctor._id } });
```

Because `authorizePermission` re-reads the role from the DB on every request,
the new permissions apply **immediately** — no token re-issue needed.

### 7.5 Grant additional permissions to a role

```js
// mongosh — give Admin the "audit:manage" permission
const perm = db.permissions.findOne({ name: "audit:manage" });
db.roles.updateOne({ name: "Admin" }, { $addToSet: { permissions: perm._id } });
```

---

## 8. Known Bugs & Limitations

### Confirmed bugs

1. **Activity-log middleware never persists anything**
   (`src/middleware/activityLogMiddleware.js`)
   It writes `entityType: "System"` and `entityId: null`, but the `AuditLog`
   schema's enum does not include `System` and `entityId` is `required`.
   Every write fails validation; the error is swallowed with a
   `console.error`, so authenticated requests still succeed but **no automatic
   audit trail is recorded**. Fix: add `"System"` to the enum (and make
   `entityId` optional), or write a valid `entityType`/`entityId`.
2. **No password-reset endpoint** — a forgotten password can only be reset by
   manually updating the database (see §7.3). No email/SMS integration exists.
3. **No role-change endpoint** — roles can only be changed directly in the DB (§7.4).
4. **Logout is client-side only** — JWTs are stateless; `POST /api/auth/logout`
   does **not** revoke the token. A stolen token stays valid until it expires
   (1 day). No token blocklist/refresh-token rotation.
5. **`GET /api/audit/:id` (and notification routes) return `500` on malformed
   ObjectIds** — e.g. `/api/audit/not-an-id` throws a Mongoose `CastError`,
   which the controller maps to `500` instead of `400/404`.
6. **`src/utils/errorCodes.js` is defined but unused** — controllers return
   ad-hoc `{ message }` bodies; the standardized codes are never emitted.
7. **`package_backup.json`** is a stray backup file in the repo root; it should
   be removed to avoid confusion.
8. **Mongoose deprecation warning** — `notificationController.js` uses
   `{ new: true }` in `findOneAndUpdate`; Mongoose 9 recommends
   `returnDocument: "after"`. Harmless today, but should be cleaned up.

### Limitations / tech debt

9. **No rate limiting, no brute-force protection** on `/api/auth/login`
   (`errorCodes.RATE_LIMIT_EXCEEDED` exists but is unused).
10. **No HTTPS enforcement, no helmet/security headers, no CSRF strategy**
    (JWT-in-header design makes CSRF less critical, but headers/CORS hardening
    is missing).
11. **CORS is wide open** — `app.use(cors())` allows all origins. Restrict to
    the frontend's origin in production.
12. **Single role per user** — the schema supports exactly one role; no
    multi-role or per-user permission overrides.
13. **No pagination caps** — `limit` from the query string is trusted (bounded
    only by whatever the client sends); consider clamping server-side.
14. **No soft deletes** — audit logs and notifications are hard-deleted.
15. **No automated CI** — tests exist (27 integration tests) but no GitHub
    Actions workflow runs them on push/PR.
16. **No data-validation layer** — validation is split between Mongoose schema
    rules and manual `if (!field)` checks in controllers; no request-body
    validation library (e.g. zod/joi) is used.
17. **Notifications are in-app only** — no email/SMS/push delivery.
18. **`app.js` connects to MongoDB and calls `listen` at module load**, so the
    app cannot be imported without side effects (tests work around this by
    rebuilding the Express app in-test). Refactor to `module.exports = app`
    and a separate `server.js` entrypoint to improve testability.

### Test-suite notes

- The integration suite currently covers authentication, RBAC, audit-log CRUD,
  notifications, health check, and 404 handling (27 tests, in-memory MongoDB).
  `POST /api/auth/staff` and `PATCH /api/auth/staff/:userId/status` are **not
  yet covered** by tests.

---

*Document generated for the TechCrush Community Health Centre project. Keep it
updated alongside route/controller changes.*





