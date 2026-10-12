// MOCK DATA. Used when DASHBOARD_MOCK=true so the frontend can be built
// before Sections 3, 4, 6 and 7 exist. Shapes here are the contract with the frontend:
// dashboardQueries.js must return exactly the same shapes.

export async function nurseDashboard() {
  return {
    awaitingTriage: 4,
    inTriage: 2,
    readyForDoctor: 3,
    todaysAppointments: 12,
  };
}

export async function doctorDashboard() {
  return {
    waiting: 3,
    todaysAppointments: 9,
    activeConsultations: 1,
    followUpsDue: 5,
  };
}

export async function adminDashboard() {
  return {
    patientFlow: {
      checked_in: 2,
      awaiting_triage: 4,
      in_triage: 2,
      ready_for_doctor: 3,
      in_consultation: 1,
      awaiting_billing: 2,
    },
    appointments: { total: 18, scheduled: 4, confirmed: 6, checked_in: 5, completed: 2, cancelled: 1 },
    waiting: 9,
    finance: {
      paymentsToday: { count: 7, total: 185000 },
      outstandingTotal: 420000,
    },
  };
}

export async function patientDashboard() {
  return {
    upcomingAppointments: [
      { id: "mock-appt-1", date: new Date(Date.now() + 2 * 86400000).toISOString(), service: "General Consultation", status: "confirmed" },
    ],
    currentVisit: { id: "mock-visit-1", status: "awaiting_triage" },
    notifications: [],
    bills: { outstandingTotal: 15000, unpaidInvoices: [{ id: "mock-inv-1", total: 15000, amountPaid: 0, status: "unpaid" }] },
  };
}

export async function operationsReport({ range }) {
  return {
    totalVisits: 214,
    visitsByStatus: { completed: 190, cancelled: 9, in_consultation: 1, awaiting_billing: 14 },
    appointmentsByStatus: { completed: 160, cancelled: 22, no_show: 11, scheduled: 18 },
    averageMinutes: { checkInToConsultation: 38.5, triage: 9.2, consultation: 17.8 },
    dailyVisits: [
      { date: range.from, count: 6 },
      { date: range.to, count: 8 },
    ],
  };
}

export async function financialReport({ range }) {
  return {
    totalRevenue: 4250000,
    paymentsByMethod: [
      { method: "cash", count: 90, total: 1800000 },
      { method: "transfer", count: 70, total: 1650000 },
      { method: "online", count: 40, total: 800000 },
    ],
    dailyRevenue: [
      { date: range.from, total: 120000 },
      { date: range.to, total: 160000 },
    ],
    outstandingTotal: 420000,
  };
}

export async function patientFlowReport() {
  return {
    stages: { awaiting_triage: 4, in_triage: 2, ready_for_doctor: 3, in_consultation: 1, awaiting_billing: 2 },
    longestWaits: [
      { visitId: "mock-visit-7", patientId: "mock-patient-3", status: "ready_for_doctor", minutesInStatus: 47 },
      { visitId: "mock-visit-9", patientId: "mock-patient-8", status: "awaiting_triage", minutesInStatus: 31 },
    ],
  };
}