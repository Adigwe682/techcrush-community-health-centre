import { getConfig } from "./dashboardConfig.js";
import { getDayBounds, parseDateRange } from "./clinicTime.js";

// Mock or real source, chosen per request. Dynamic import means mock mode
// never loads the other sections' models, so it works before they exist.
async function loadSource() {
  return getConfig().useMock
    ? import("./dashboardMock.js")
    : import("./dashboardQueries.js");
}

const buildContext = (req) => {
  const now = new Date();
  return { user: req.user, now, day: getDayBounds(now) };
};

// Wraps a handler: loads the source, runs it, sends { success, data, meta }.
const handle = (run) => async (req, res) => {
  try {
    const source = await loadSource();
    const { data, meta = {} } = await run(source, req);

    res.status(200).json({
      success: true,
      data,
      meta: { ...meta, generatedAt: new Date().toISOString(), mock: getConfig().useMock },
    });
  } catch (error) {
    const status = error.status || 500;

    if (status === 500) console.error("Dashboard error:", error);

    res.status(status).json({
      success: false,
      message: status === 500 ? "Server error" : error.message,
    });
  }
};

const dashboard = (name) =>
  handle(async (source, req) => ({ data: await source[name](buildContext(req)) }));

const report = (name) =>
  handle(async (source, req) => {
    const range = parseDateRange(req.query);
    const data = await source[name]({ ...buildContext(req), range });
    return { data, meta: { from: range.from, to: range.to, timezone: getConfig().timezone } };
  });

export const getNurseDashboard = dashboard("nurseDashboard");
export const getDoctorDashboard = dashboard("doctorDashboard");
export const getAdminDashboard = dashboard("adminDashboard");
export const getPatientDashboard = dashboard("patientDashboard");

export const getOperationsReport = report("operationsReport");
export const getFinancialReport = report("financialReport");
export const getPatientFlowReport = handle(async (source, req) => ({
  data: await source.patientFlowReport(buildContext(req)),
}));