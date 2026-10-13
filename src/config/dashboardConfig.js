const getConfig = () => ({
  timezone: process.env.CLINIC_TIMEZONE || "Africa/Lagos",
  useMock: process.env.DASHBOARD_MOCK === "true",
  maxReportDays: 366,
  defaultReportDays: 30,
  currencyIsKobo: process.env.CURRENCY_IS_KOBO === "true",
});

const VISIT_STATUS = {
  WAITING: "waiting",
  IN_PROGRESS: "in-progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

const CLOSED_VISIT_STATUSES = [
  VISIT_STATUS.COMPLETED,
  VISIT_STATUS.CANCELLED,
];

const APPOINTMENT_STATUS = {
  SCHEDULED: "SCHEDULED",
  CHECKED_IN: "CHECKED_IN",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  NO_SHOW: "NO_SHOW",
};

const FOLLOWUP_STATUS = {
  PENDING: "pending",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

const INVOICE_STATUS = {
  UNPAID: "unpaid",
  PARTIALLY_PAID: "partially_paid",
  PAID: "paid",
};

const PAYMENT_STATUS = {
  SUCCESSFUL: "successful",
  PENDING: "pending",
  FAILED: "failed",
};

const PAYMENT_METHODS = {
  CASH: "cash",
  BANK_TRANSFER: "bank_transfer",
  CARD: "card",
  ONLINE: "online",
};

const ROLES = {
  ADMIN: "Admin",
  NURSE: "Nurse",
  DOCTOR: "Doctor",
  CASHIER: "Cashier",
  PATIENT: "Patient",
};

module.exports = {
  getConfig,
  VISIT_STATUS,
  CLOSED_VISIT_STATUSES,
  APPOINTMENT_STATUS,
  FOLLOWUP_STATUS,
  INVOICE_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHODS,
  ROLES,
};
