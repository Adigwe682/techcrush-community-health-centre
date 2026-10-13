async function nurseDashboard() {
  return {
    summary: {
      waitingPatients: 8,
      patientsInTriage: 3,
      completedToday: 12,
    },
    message: "Sample nurse dashboard data",
  };
}

async function doctorDashboard() {
  return {
    summary: {
      waitingPatients: 5,
      patientsSeenToday: 10,
      appointmentsToday: 7,
    },
    message: "Sample doctor dashboard data",
  };
}

async function adminDashboard() {
  return {
    summary: {
      totalPatients: 150,
      appointmentsToday: 18,
      visitsToday: 25,
      revenueToday: 125000,
    },
    message: "Sample admin dashboard data",
  };
}

async function patientDashboard() {
  return {
    summary: {
      upcomingAppointments: 1,
      completedVisits: 4,
      outstandingBalance: 0,
    },
    message: "Sample patient dashboard data",
  };
}

async function operationsReport() {
  return {
    summary: {
      totalVisits: 25,
      completedVisits: 17,
      waitingVisits: 8,
    },
    message: "Sample operations report",
  };
}

async function financialReport() {
  return {
    summary: {
      totalBilled: 250000,
      totalPaid: 175000,
      outstandingBalance: 75000,
    },
    message: "Sample financial report",
  };
}

async function patientFlowReport() {
  return {
    summary: {
      registeredPatients: 12,
      walkInVisits: 9,
      appointmentVisits: 16,
    },
    message: "Sample patient flow report",
  };
}

module.exports = {
  nurseDashboard,
  doctorDashboard,
  adminDashboard,
  patientDashboard,
  operationsReport,
  financialReport,
  patientFlowReport,
};
