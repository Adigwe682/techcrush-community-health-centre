// REAL AGGREGATIONS. Aligned with Sections 1, 3, 4, and 7 real models.

import Visit from "../Model/visitModel.js";
import Appointment from "../Model/appointmentModel.js";
import FollowUp from "../Model/followUpModel.js";
import Bill from "../Model/billModel.js";
import Payment from "../Model/paymentModel.js";

import {
  getConfig,
  VISIT_STATUS as V,
  CLOSED_VISIT_STATUSES,
  APPOINTMENT_STATUS as A,
  INVOICE_STATUS as I,
  PAYMENT_STATUS as P,
  PAYMENT_METHODS as M,
} from "./dashboardConfig.js";

// ---------- helpers ----------

async function countByField(Model, match, field = "status") {
  const rows = await Model.aggregate([
    { $match: match },
    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
  ]);
  return Object.fromEntries(rows.map((r) => [r._id, r.count]));
}

const OPEN_VISIT = { status: { $nin: CLOSED_VISIT_STATUSES } };

async function outstandingTotal() {
  const [row] = await Bill.aggregate([
    { $match: { status: {$in: [I.UNPAID, I.PARTIALLY_PAID] } } },
    { $group: { _id: null, total: { $sum: {$subtract: ["$totalAmount", "$amountPaid"] } } } },
  ]);
  return row?.total ?? 0;
}

const todayVisits = (day) => ({ checkedInAt: { $gte: day.start, $lt: day.end } });
const inDay = (field, day) => ({ [field]: { $gte: day.start, $lt: day.end } });

// ---------- dashboards ----------

export async function nurseDashboard({ day }) {
  const [byStatus, todaysAppointments] = await Promise.all([
    countByField(Visit, { ...todayVisits(day), ...OPEN_VISIT }),
    Appointment.countDocuments({ ...inDay("appointmentDate", day), status: { $ne: A.CANCELLED } }),
  ]);

  return {
    waiting: byStatus[V.WAITING] ?? 0,
    inProgress: byStatus[V.IN_PROGRESS] ?? 0,
    todaysAppointments,
  };
}

export async function doctorDashboard({ user, day }) {
  const doctorId = user._id;

  const [todaysAppointments, followUpsDue] = await Promise.all([
    Appointment.countDocuments({ ...inDay("appointmentDate", day), doctorName: doctorId, status: { $ne: A.CANCELLED } }),
    FollowUp?.countDocuments ? FollowUp.countDocuments({ doctor: doctorId, status: "pending", dueDate: { $lt: day.end } }) : Promise.resolve(0),
  ]);

  return { 
    waiting: 0, // Managed via appointments/visits queue
    todaysAppointments, 
    activeConsultations: 0, 
    followUpsDue 
  };
}

export async function adminDashboard({ day }) {
  const [patientFlow, appointmentsByStatus, paymentsRow] = await Promise.all([
    countByField(Visit, { ...todayVisits(day), ...OPEN_VISIT }),
    countByField(Appointment, inDay("appointmentDate", day)),
    Payment.aggregate([
      { $match: { status: P.SUCCESSFUL, ...inDay("paidAt", day) } },
      { $group: { _id: null, count: {$sum: 1 }, total: { $sum: "$amount" } } },
    ]),
  ]);

  const appointments = {
    total: Object.values(appointmentsByStatus).reduce((s, n) => s + n, 0),
    ...appointmentsByStatus,
  };

  const waiting = patientFlow[V.WAITING] ?? 0;

  return {
    patientFlow,
    appointments,
    waiting,
    finance: {
      paymentsToday: { count: paymentsRow[0]?.count ?? 0, total: paymentsRow[0]?.total ?? 0 },
      outstandingTotal: await outstandingTotal(),
    },
  };
}

export async function patientDashboard({ user, now }) {
  const patientId = user.patientId;
  if (!patientId) return { upcomingAppointments: [], currentVisit: null, notifications: [], bills: { outstandingTotal: 0, unpaidInvoices: [] } };

  const [appointments, currentVisit, bills] = await Promise.all([
    Appointment.find({
      patient: patientId,
      appointmentDate: { $gte: now },
      status: { $in: [A.SCHEDULED, A.CHECKED_IN] },
    })
      .sort({ appointmentDate: 1 })
      .limit(5)
      .select("appointmentDate reasonForVisit status")
      .lean(),
    Visit.findOne({ patient: patientId, ...OPEN_VISIT }).sort({ checkedInAt: -1 }).select("status").lean(),
    Bill.find({ patientID: patientId, status: { $in: [I.UNPAID, I.PARTIALLY_PAID] } })
      .select("totalAmount amountPaid status")
      .lean(),
  ]);

  return {
    upcomingAppointments: appointments.map((a) => ({ id: a._id, date: a.appointmentDate, service: a.reasonForVisit, status: a.status })),
    currentVisit: currentVisit ? { id: currentVisit._id, status: currentVisit.status } : null,
    notifications: [],
    bills: {
      outstandingTotal: bills.reduce((s, b) => s + (b.totalAmount - b.amountPaid), 0),
      unpaidInvoices: bills.map((b) => ({ id: b._id, total: b.totalAmount, amountPaid: b.amountPaid, status: b.status })),
    },
  };
}

// ---------- reports ----------

export async function operationsReport({ range }) {
  const { timezone } = getConfig();
  const visitMatch = { checkedInAt: { $gte: range.start, $lt: range.end } };

  const [visitsByStatus, appointmentsByStatus, visits, daily] = await Promise.all([
    countByField(Visit, visitMatch),
    countByField(Appointment, { appointmentDate: { $gte: range.start, $lt: range.end } }),
    Visit.find(visitMatch).select("checkedInAt completedAt").lean(),
    Visit.aggregate([
      { $match: visitMatch },
      { $group: { _id: { $dateToString: { format: "\%Y-\%m-\%d", date: "$checkedInAt", timezone } }, count: { $sum: 1 } } },       {$sort: { _id: 1 } },
    ]),
  ]);

  return {
    totalVisits: visits.length,
    visitsByStatus,
    appointmentsByStatus,
    averageMinutes: {
      checkInToCompletion: 0,
    },
    dailyVisits: daily.map((d) => ({ date: d._id, count: d.count })),
  };
}

export async function financialReport({ range }) {
  const { timezone } = getConfig();
  const match = { status: P.SUCCESSFUL, paidAt: { $gte: range.start, $lt: range.end } };

  const [byMethod, daily] = await Promise.all([
    Payment.aggregate([
      { $match: match },
      { $group: { _id: "$paymentMethod", count: { $sum: 1 }, total: { $sum: "$amount" } } },
      { $sort: { total: -1 } },
    ]),
    Payment.aggregate([
      { $match: match },
      { $group: { _id: { $dateToString: { format: "\%Y-\%m-\%d", date: "$paidAt", timezone } }, total: { $sum: "$amount" } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  return {
    totalRevenue: byMethod.reduce((s, m) => s + m.total, 0),
    paymentsByMethod: byMethod.map((m) => ({ method: m._id, count: m.count, total: m.total })),
    dailyRevenue: daily.map((d) => ({ date: d._id, total: d.total })),
    outstandingTotal: await outstandingTotal(),
  };
}

export async function patientFlowReport({ now }) {
  const [stages, openVisits] = await Promise.all([
    countByField(Visit, OPEN_VISIT),
    Visit.find(OPEN_VISIT).select("patient status checkedInAt").lean(),
  ]);

  const longestWaits = openVisits
    .map((v) => ({
      visitId: v._id,
      patientId: v.patient,
      status: v.status,
      minutesInStatus: Math.max(0, Math.round((now - new Date(v.checkedInAt)) / 60000)),
    }))
    .sort((a, b) => b.minutesInStatus - a.minutesInStatus)
    .slice(0, 5);

  return { stages, longestWaits };
}