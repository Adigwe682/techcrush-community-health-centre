/**
 * Test database setup for Community Health Centre API integration tests.
 * Starts an in-memory MongoDB server (using the locally cached mongod
 * binary) and connects Mongoose to it so models can be used directly.
 */

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-key";
process.env.AUDIT_ENABLED = "true";
process.env.NOTIFICATION_ENABLED = "true";

const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const fs = require("fs");
const os = require("os");
const path = require("path");

// Ensure the dbPath directory exists
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Prefer the mongod binary already cached by mongodb-memory-server so no
// download is required when running the tests offline
const CACHED_MONGOD = path.join(
  __dirname,
  "node_modules",
  ".cache",
  "mongodb-memory-server",
  "mongod-x64-win32-8.2.6.exe"
);

const dbPath = path.join(os.tmpdir(), "mongo-test-db");

let mongoMemoryServer = null;
let isUsingMemoryServer = false;

const setupTestDB = async () => {
  try {
    // Remove any dirty dbPath left behind by previously killed runs
    // (stale WiredTiger locks make mongod hang on startup)
    if (fs.existsSync(dbPath)) {
      try {
        fs.rmSync(dbPath, { recursive: true, force: true });
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    ensureDir(dbPath);

    // Use the cached binary when it exists; otherwise let the library
    // resolve (or download) the right version itself
    if (fs.existsSync(CACHED_MONGOD)) {
      process.env.MONGOMS_SYSTEM_BINARY = CACHED_MONGOD;
    }

    // Use our own storage engine choice that does not rely on the
    // leftover dbPath state; fresh dir every run
    mongoMemoryServer = await MongoMemoryServer.create({
      instance: {
        dbPath,
        storageEngine: "wiredTiger",
      },
    });

    const uri = mongoMemoryServer.getUri();
    process.env.MONGO_URI = uri;
    isUsingMemoryServer = true;
    console.log("MongoDB memory server started at:", uri);

    // Connect Mongoose so models and populate() work in tests.
    // runtimeAdapters.os: the mongodb driver 7.x normally loads its `os`
    // adapter via dynamic import(), which fails inside Jest's CJS sandbox;
    // the rejection is swallowed by the driver and results in an empty
    // client metadata document that mongod rejects at handshake time.
    // Passing the adapter explicitly avoids the dynamic import.
    await mongoose.connect(uri, {
      dbName: "test",
      runtimeAdapters: { os },
    });
    console.log("Mongoose connected to the test database");
  } catch (error) {
    console.error("Failed to start MongoDB memory server:", error.message);

    // Clean up if dir was created but server failed
    if (fs.existsSync(dbPath)) {
      try {
        fs.rmSync(dbPath, { recursive: true, force: true });
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    // Fall back to using environment MongoDB URI
    if (!process.env.MONGO_URI) {
      throw new Error("No MongoDB connection available for testing.");
    }
    isUsingMemoryServer = false;
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: "test",
      runtimeAdapters: { os },
    });
  }
};

const teardownTestDB = async () => {
  // Disconnect Mongoose first so the memory server can stop cleanly
  try {
    await mongoose.disconnect();
  } catch (error) {
    console.error("Error disconnecting Mongoose:", error.message);
  }

  if (isUsingMemoryServer && mongoMemoryServer) {
    try {
      await mongoMemoryServer.stop();
      console.log("MongoDB memory server stopped");
    } catch (error) {
      console.error("Error stopping MongoDB memory server:", error.message);
    }
    isUsingMemoryServer = false;
  }
  mongoMemoryServer = null;

  // Clean up dbPath directory
  if (fs.existsSync(dbPath)) {
    try {
      fs.rmSync(dbPath, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  }
};

const cleanupDB = async () => {
  if (mongoose.connection.readyState === 1) {
    try {
      const collections = await mongoose.connection.db.collections();
      for (const collection of collections) {
        await collection.deleteMany({});
      }
    } catch (error) {
      console.error("Error cleaning up database:", error.message);
    }
  }
};

module.exports = {
  setupTestDB,
  teardownTestDB,
  cleanupDB,
};
