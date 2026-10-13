const { getConfig } = require("../config/dashboardConfig");
const { parseDateRange, getDayBounds } = require("../config/clinicTime");

const mock = require("../dashboard/dashboardMock");

async function runDashboard(res, handler, req) {
  try {
    const config = getConfig();

    if (!config.useMock) {
      return res.status(501).json({
        success: false,
        message:
          "Real dashboard queries are not configured yet. Set DASHBOARD_MOCK=true to use sample data.",
      });
    }

    const data = await handler(req);
    return res.status(200).json({
      success: true,
      data,
      meta: {
        mock: true,
        timezone: config.timezone,
      },
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Dashboard request failed",
    });
  }
}

const nurseDashboard = (req, res) =>
  runDashboard(res, () => mock.nurseDashboard(), req);

const doctorDashboard = (req, res) =>
  runDashboard(res, () => mock.doctorDashboard(), req);

const adminDashboard = (req, res) =>
  runDashboard(res, () => mock.adminDashboard(), req);

const patientDashboard = (req, res) =>
  runDashboard(res, () => mock.patientDashboard(), req);

const operationsReport = (req, res) =>
  runDashboard(
    res,
    () => {
      parseDateRange(req.query);
      return mock.operationsReport();
    },
    req,
  );

const financialReport = (req, res) =>
  runDashboard(
    res,
    () => {
      parseDateRange(req.query);
      return mock.financialReport();
    },
    req,
  );

const patientFlowReport = (req, res) =>
  runDashboard(
    res,
    () => {
      parseDateRange(req.query);
      return mock.patientFlowReport();
    },
    req,
  );

module.exports = {
  nurseDashboard,
  doctorDashboard,
  adminDashboard,
  patientDashboard,
  operationsReport,
  financialReport,
  patientFlowReport,
};
