import express from "express";

import { requireAuth, allowRoles } from "./authMiddleware.js";
import { ROLES } from "./dashboardConfig.js";
import {
  getNurseDashboard,
  getDoctorDashboard,
  getAdminDashboard,
  getPatientDashboard,
  getOperationsReport,
  getFinancialReport,
  getPatientFlowReport,
} from "./dashboardController.js";

const { ADMIN, NURSE, DOCTOR, CASHIER, PATIENT } = ROLES;

const dashboardRoute = express.Router();

dashboardRoute.use(requireAuth);

// Dashboards: each role sees only its own.
dashboardRoute.get("/dashboard/nurse", allowRoles(NURSE), getNurseDashboard);
dashboardRoute.get("/dashboard/doctor", allowRoles(DOCTOR), getDoctorDashboard);
dashboardRoute.get("/dashboard/admin", allowRoles(ADMIN), getAdminDashboard);
dashboardRoute.get("/dashboard/patient", allowRoles(PATIENT), getPatientDashboard);

// Reports: operational and flow reports are Admin only; cashiers may also see finance.
dashboardRoute.get("/reports/operations", allowRoles(ADMIN), getOperationsReport);
dashboardRoute.get("/reports/financial", allowRoles(ADMIN, CASHIER), getFinancialReport);
dashboardRoute.get("/reports/patient-flow", allowRoles(ADMIN), getPatientFlowReport);

export default dashboardRoute;