// Section 8 config.
// Settings are read through a function (not at import time) because dotenv.config()
// runs AFTER ES-module imports are evaluated in server.js.

export const getConfig = () => ({
  timezone: process.env.CLINIC_TIMEZONE || "Africa/Lagos",
  useMock: process.env.DASHBOARD_MOCK === "true",
  maxReportDays: 366,
  defaultReportDays: 30,
  // Set to true if Section 7 stores financial amounts in kobo instead of naira
  currencyIsKobo: process.env.CURRENCY_IS_KOBO === "true",
});

// Section 4 (Visits)
export const VISIT_STATUS = {
  WAITING: "waiting",
  IN_PROGRESS: "in-progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

export const CLOSED_VISIT_STATUSES = [VISIT_STATUS.COMPLETED, VISIT_STATUS.CANCELLED];

// Section 3 (Appointments)
export const APPOINTMENT_STATUS = {
  SCHEDULED: "SCHEDULED",
  CHECKED_IN: "CHECKED_IN",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  NO_SHOW: "NO_SHOW",
};

// Section 6 (Follow-ups - default fallback)
export const FOLLOWUP_STATUS = {
  PENDING: "pending",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

// Section 7 (Billing / Invoices)
export const INVOICE_STATUS = {
  UNPAID: "unpaid",
  PARTIALLY_PAID: "partially_paid",
  PAID: "paid",
};

// Section 7 (Payments)
export const PAYMENT_STATUS = { 
  SUCCESSFUL: "successful", 
  PENDING: "pending", 
  FAILED: "failed" 
};

export const PAYMENT_METHODS = {
  CASH: "cash",
  BANK_TRANSFER: "bank_transfer",
  CARD: "card",
  ONLINE: "online",
};

// Section 1 (Users & Roles)
export const ROLES = {
  ADMIN: "admin",
  NURSE: "nurse",
  DOCTOR: "doctor",
  CASHIER: "cashier",
  PATIENT: "patient",
};