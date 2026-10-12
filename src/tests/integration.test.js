/**
 * Integration tests for the Community Health Centre API
 * Covers authentication, RBAC, audit logs, notifications,
 * health check, and error handling using an in-memory MongoDB.
 */

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-key";

const mongoose = require("mongoose");
const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");

// Shared test DB helpers (started once per test file)
const { setupTestDB, teardownTestDB } = require("../../jest.setup.js");

const User = require("../models/User");
const Role = require("../models/Role");
const Permission = require("../models/Permission");
const AuditLog = require("../models/AuditLog");
const Notification = require("../models/Notification");

const { healthCheck } = require("../controllers/healthController");
const { notFoundHandler, handleError } = require("../middleware/errorHandler");

/**
 * Build a test app that mirrors src/app.js (routes, 404 handler and
 * global error handler) without starting a server or opening a DB
 * connection, since those are handled by jest.setup.js.
 * Note: activityLogMiddleware is intentionally not mounted here because
 * it writes an audit entry for every request, which would pollute the
 * assertions in the audit log tests.
 */
const createTestApp = () => {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint (no auth required)
  app.get("/api/health", healthCheck);

  // API routes (same as src/app.js)
  app.use("/api/auth", require("../routes/authRoutes"));
  app.use("/api/audit", require("../routes/auditLogRoutes"));
  app.use("/api/notifications", require("../routes/notificationRoutes"));

  // 404 handler and global error handler
  app.use(notFoundHandler);
  app.use(handleError);

  return app;
};

const app = createTestApp();

/** Sign a JWT the same way the login controller does */
const signToken = (user, roleName) =>
  jwt.sign(
    { userId: user._id, email: user.email, role: roleName },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

/** Seed permissions, roles and users; run before every test */
const seedTestData = async () => {
  await Notification.deleteMany({});
  await AuditLog.deleteMany({});
  await User.deleteMany({});
  await Role.deleteMany({});
  await Permission.deleteMany({});

  const auditManage = await Permission.create({ name: "audit:manage" });
  const auditRead = await Permission.create({ name: "audit:read" });
  const notificationRead = await Permission.create({
    name: "notification:read",
  });

  const adminRole = await Role.create({
    name: "Admin",
    description: "Administrator",
    permissions: [auditManage._id],
  });
  const staffRole = await Role.create({
    name: "Staff",
    description: "General staff",
    permissions: [auditRead._id, notificationRead._id],
  });

  const admin = await User.create({
    firstName: "Admin",
    lastName: "User",
    email: "admin@test.com",
    password: "admin123",
    role: adminRole._id,
  });
  const staff = await User.create({
    firstName: "Staff",
    lastName: "User",
    email: "staff@test.com",
    password: "staff123",
    role: staffRole._id,
  });

  return {
    admin,
    staff,
    adminRole,
    staffRole,
    adminToken: signToken(admin, adminRole.name),
    staffToken: signToken(staff, staffRole.name),
  };
};

let seed = null;

beforeAll(async () => {
  await setupTestDB();
}, 30000);

beforeEach(async () => {
  seed = await seedTestData();
});

afterAll(async () => {
  await teardownTestDB();
});

// =====================================================
// AUTHENTICATION
// =====================================================
describe("Authentication - POST /api/auth/login", () => {
  test("logs in with valid credentials and returns a token", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "staff@test.com", password: "staff123" });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body).toHaveProperty("user");
    expect(res.body.user.email).toEqual("staff@test.com");
    expect(res.body.user.role).toEqual("Staff");
  });

  test("rejects an invalid password with 401", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "staff@test.com", password: "wrongpassword" });

    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toContain("Invalid");
  });

  test("rejects a non-existent user with 401", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@test.com", password: "password123" });

    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toContain("Invalid");
  });

  test("rejects missing fields with 400", async () => {
    const res = await request(app).post("/api/auth/login").send({});

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("message");
  });

  test("rejects a deactivated account with 403", async () => {
    seed.staff.isActive = false;
    await seed.staff.save();

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "staff@test.com", password: "staff123" });

    expect(res.statusCode).toEqual(403);
    expect(res.body.message).toContain("inactive");
  });
});

describe("Authentication - POST /api/auth/logout", () => {
  test("logs out an authenticated user", async () => {
    const res = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${seed.staffToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toContain("Logout successful");
  });
});

// =====================================================
// AUTHORIZATION (RBAC)
// =====================================================
describe("Authorization (RBAC)", () => {
  test("protected route returns 401 without a token", async () => {
    const res = await request(app).get("/api/audit");

    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toContain("Authentication required");
  });

  test("protected route returns 401 for an invalid token", async () => {
    const res = await request(app)
      .get("/api/audit")
      .set("Authorization", "Bearer not-a-valid-token");

    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toContain("Invalid or expired token");
  });

  test("returns 403 when the role lacks the required permission", async () => {
    const res = await request(app)
      .post("/api/audit")
      .set("Authorization", `Bearer ${seed.staffToken}`)
      .send({
        entityType: "Patient",
        entityId: new mongoose.Types.ObjectId().toString(),
        action: "CREATE",
      });

    expect(res.statusCode).toEqual(403);
    expect(res.body.message).toContain("permission");
  });

  test("allows access when the role has the required permission", async () => {
    const res = await request(app)
      .post("/api/audit")
      .set("Authorization", `Bearer ${seed.adminToken}`)
      .send({
        entityType: "Patient",
        entityId: new mongoose.Types.ObjectId().toString(),
        action: "CREATE",
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty("message");
    expect(res.body).toHaveProperty("data");
  });

  test("returns 403 for deactivated accounts", async () => {
    seed.staff.isActive = false;
    await seed.staff.save();

    const res = await request(app)
      .post("/api/audit")
      .set("Authorization", `Bearer ${seed.staffToken}`)
      .send({
        entityType: "Patient",
        entityId: new mongoose.Types.ObjectId().toString(),
        action: "CREATE",
      });

    expect(res.statusCode).toEqual(403);
    expect(res.body.message).toContain("inactive");
  });
});


// =====================================================
// AUDIT LOGS
// =====================================================
describe("Audit Logs", () => {
  test("GET /api/audit returns only the user's own logs with pagination", async () => {
    await AuditLog.create({
      user: seed.staff._id,
      entityType: "Patient",
      entityId: new mongoose.Types.ObjectId(),
      action: "CREATE",
    });
    await AuditLog.create({
      user: seed.admin._id,
      entityType: "User",
      entityId: new mongoose.Types.ObjectId(),
      action: "UPDATE",
    });

    const res = await request(app)
      .get("/api/audit")
      .set("Authorization", `Bearer ${seed.staffToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].action).toEqual("CREATE");
    expect(res.body.pagination).toHaveProperty("total", 1);
  });

  test("GET /api/audit/all returns all logs for admins", async () => {
    await AuditLog.create({
      user: seed.staff._id,
      entityType: "Patient",
      entityId: new mongoose.Types.ObjectId(),
      action: "CREATE",
    });
    await AuditLog.create({
      user: seed.admin._id,
      entityType: "User",
      entityId: new mongoose.Types.ObjectId(),
      action: "UPDATE",
    });

    const res = await request(app)
      .get("/api/audit/all")
      .set("Authorization", `Bearer ${seed.adminToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toHaveLength(2);
  });

  test("GET /api/audit/all returns 403 for non-admins", async () => {
    const res = await request(app)
      .get("/api/audit/all")
      .set("Authorization", `Bearer ${seed.staffToken}`);

    expect(res.statusCode).toEqual(403);
  });

  test("GET /api/audit/:id returns a log by id for admins", async () => {
    const log = await AuditLog.create({
      user: seed.admin._id,
      entityType: "Role",
      entityId: new mongoose.Types.ObjectId(),
      action: "CREATE",
    });

    const res = await request(app)
      .get(`/api/audit/${log._id}`)
      .set("Authorization", `Bearer ${seed.adminToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.data._id).toEqual(log._id.toString());
  });

  test("GET /api/audit/:id returns 404 for a missing log", async () => {
    const res = await request(app)
      .get(`/api/audit/${new mongoose.Types.ObjectId()}`)
      .set("Authorization", `Bearer ${seed.adminToken}`);

    expect(res.statusCode).toEqual(404);
  });

  test("DELETE /api/audit/:id deletes a log for admins", async () => {
    const log = await AuditLog.create({
      user: seed.admin._id,
      entityType: "Role",
      entityId: new mongoose.Types.ObjectId(),
      action: "DELETE",
    });

    const res = await request(app)
      .delete(`/api/audit/${log._id}`)
      .set("Authorization", `Bearer ${seed.adminToken}`);

    expect(res.statusCode).toEqual(200);
    expect(await AuditLog.findById(log._id)).toBeNull();
  });
});


// =====================================================
// NOTIFICATIONS
// =====================================================
describe("Notifications", () => {
  test("POST /api/notifications creates a notification", async () => {
    const res = await request(app)
      .post("/api/notifications")
      .set("Authorization", `Bearer ${seed.staffToken}`)
      .send({ title: "Queue update", message: "Room 3 is now free" });

    expect(res.statusCode).toEqual(201);
    expect(res.body.data.title).toEqual("Queue update");
    expect(res.body.data.read).toEqual(false);
  });

  test("POST /api/notifications requires title and message", async () => {
    const res = await request(app)
      .post("/api/notifications")
      .set("Authorization", `Bearer ${seed.staffToken}`)
      .send({});

    expect(res.statusCode).toEqual(400);
  });

  test("GET /api/notifications returns only the user's notifications", async () => {
    await Notification.create({
      user: seed.staff._id,
      title: "Staff notification",
      message: "For staff only",
    });
    await Notification.create({
      user: seed.admin._id,
      title: "Admin notification",
      message: "For admin only",
    });

    const res = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${seed.staffToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toEqual("Staff notification");
  });

  test("GET /api/notifications/unread-count counts unread notifications", async () => {
    await Notification.create({
      user: seed.staff._id,
      title: "First",
      message: "First message",
    });
    await Notification.create({
      user: seed.staff._id,
      title: "Second",
      message: "Second message",
      read: true,
      readAt: new Date(),
    });

    const res = await request(app)
      .get("/api/notifications/unread-count")
      .set("Authorization", `Bearer ${seed.staffToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toEqual(1);
  });

  test("PATCH /api/notifications/:id/read marks one notification as read", async () => {
    const notification = await Notification.create({
      user: seed.staff._id,
      title: "Read me",
      message: "Mark as read",
    });

    const res = await request(app)
      .patch(`/api/notifications/${notification._id}/read`)
      .set("Authorization", `Bearer ${seed.staffToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.data.read).toEqual(true);
    expect(res.body.data.readAt).toBeTruthy();
  });

  test("PATCH /api/notifications/read-all marks all as read", async () => {
    await Notification.create({
      user: seed.staff._id,
      title: "One",
      message: "First",
    });
    await Notification.create({
      user: seed.staff._id,
      title: "Two",
      message: "Second",
    });

    const res = await request(app)
      .patch("/api/notifications/read-all")
      .set("Authorization", `Bearer ${seed.staffToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.data.modifiedCount).toEqual(2);
  });

  test("users cannot mark another user's notification as read", async () => {
    const adminNotification = await Notification.create({
      user: seed.admin._id,
      title: "Admin only",
      message: "Not yours",
    });

    const res = await request(app)
      .patch(`/api/notifications/${adminNotification._id}/read`)
      .set("Authorization", `Bearer ${seed.staffToken}`);

    expect(res.statusCode).toEqual(404);
  });

  test("DELETE /api/notifications/:id deletes a notification", async () => {
    const notification = await Notification.create({
      user: seed.staff._id,
      title: "Delete me",
      message: "To be deleted",
    });

    const res = await request(app)
      .delete(`/api/notifications/${notification._id}`)
      .set("Authorization", `Bearer ${seed.staffToken}`);

    expect(res.statusCode).toEqual(200);
    expect(await Notification.findById(notification._id)).toBeNull();
  });
});


// =====================================================
// HEALTH CHECK
// =====================================================
describe("Health Check", () => {
  test("GET /api/health returns healthy status with DB info", async () => {
    const res = await request(app).get("/api/health");

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("status", "healthy");
    expect(res.body).toHaveProperty("timestamp");
    expect(res.body).toHaveProperty("uptime");
    expect(res.body.database).toHaveProperty("status", "connected");
    expect(res.body.auditLogging).toHaveProperty("enabled", true);
    expect(res.body.notifications).toHaveProperty("enabled", true);
  });
});

// =====================================================
// ERROR HANDLING
// =====================================================
describe("Error Handling", () => {
  test("unknown routes return 404", async () => {
    const res = await request(app).get("/api/does-not-exist");

    expect(res.statusCode).toEqual(404);
    expect(res.body).toHaveProperty("statusCode", 404);
    expect(res.body.message).toContain("Not Found");
  });
});




