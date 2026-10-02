const mongoose = require("mongoose");
const dotenv = require("dotenv");

const Role = require("../models/Role");
const Permission = require("../models/Permission");

dotenv.config();


// ======================================================
// PERMISSIONS
// ======================================================

const permissions = [
  {
    name: "staff:create",
    description: "Create staff accounts",
  },
  {
    name: "staff:view",
    description: "View staff accounts",
  },
  {
    name: "staff:update",
    description: "Activate or deactivate staff accounts",
  },
  {
    name: "patient:create",
    description: "Register patients",
  },
  {
    name: "patient:view",
    description: "View patient information",
  },
  {
    name: "patient:update",
    description: "Update patient information",
  },
  {
    name: "appointment:create",
    description: "Create appointments",
  },
  {
    name: "appointment:view",
    description: "View appointments",
  },
  {
    name: "appointment:update",
    description: "Update appointments",
  },
  {
    name: "queue:manage",
    description: "Manage patient queue",
  },
  {
    name: "vitals:create",
    description: "Record patient vitals",
  },
  {
    name: "clinical:view",
    description: "View clinical information",
  },
  {
    name: "clinical:create",
    description: "Create clinical records",
  },
  {
    name: "diagnosis:create",
    description: "Create diagnoses",
  },
  {
    name: "prescription:create",
    description: "Create prescriptions",
  },
  {
    name: "billing:create",
    description: "Create invoices",
  },
  {
    name: "billing:view",
    description: "View billing information",
  },
  {
    name: "payment:create",
    description: "Record payments",
  },
  {
    name: "receipt:create",
    description: "Generate receipts",
  },
  {
    name: "reports:view",
    description: "View reports",
  },
];


// ======================================================
// ROLE PERMISSIONS
// ======================================================

const rolePermissions = {
  Admin: [
    "staff:create",
    "staff:view",
    "staff:update",
    "patient:create",
    "patient:view",
    "patient:update",
    "appointment:create",
    "appointment:view",
    "appointment:update",
    "queue:manage",
    "vitals:create",
    "clinical:view",
    "clinical:create",
    "diagnosis:create",
    "prescription:create",
    "billing:create",
    "billing:view",
    "payment:create",
    "receipt:create",
    "reports:view",
  ],

  Receptionist: [
    "patient:create",
    "patient:view",
    "patient:update",
    "appointment:create",
    "appointment:view",
    "appointment:update",
    "queue:manage",
    "vitals:create",
    "billing:view",
  ],

  Nurse: [
    "patient:view",
    "patient:update",
    "appointment:view",
    "queue:manage",
    "vitals:create",
    "clinical:view",
    "clinical:create",
  ],

  Doctor: [
    "patient:view",
    "appointment:view",
    "queue:manage",
    "clinical:view",
    "clinical:create",
    "diagnosis:create",
    "prescription:create",
  ],

  Cashier: [
    "patient:view",
    "billing:create",
    "billing:view",
    "payment:create",
    "receipt:create",
  ],
};


// ======================================================
// SEED FUNCTION
// ======================================================

const seedRBAC = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");


    // --------------------------------------------------
    // CREATE PERMISSIONS
    // --------------------------------------------------

    const permissionDocuments = [];

    for (const permission of permissions) {
      const existingPermission = await Permission.findOne({
        name: permission.name,
      });

      if (existingPermission) {
        permissionDocuments.push(existingPermission);
      } else {
        const newPermission = await Permission.create(permission);

        permissionDocuments.push(newPermission);
      }
    }


    // --------------------------------------------------
    // CREATE ROLES
    // --------------------------------------------------

    for (const [roleName, permissionNames] of Object.entries(
      rolePermissions
    )) {
      const rolePermissionIds = permissionDocuments
        .filter((permission) =>
          permissionNames.includes(permission.name)
        )
        .map((permission) => permission._id);


      const existingRole = await Role.findOne({
        name: roleName,
      });


      if (existingRole) {
        existingRole.permissions = rolePermissionIds;

        await existingRole.save();

        console.log(`${roleName} role updated`);
      } else {
        await Role.create({
          name: roleName,
          description: `${roleName} system role`,
          permissions: rolePermissionIds,
        });

        console.log(`${roleName} role created`);
      }
    }


    console.log("RBAC seed completed successfully");

    await mongoose.disconnect();

    process.exit(0);
  } catch (error) {
    console.error("RBAC seed failed:", error.message);

    await mongoose.disconnect();

    process.exit(1);
  }
};


// ======================================================
// RUN SEED
// ======================================================

seedRBAC();