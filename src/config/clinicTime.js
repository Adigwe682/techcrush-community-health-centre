const { getConfig } = require("./dashboardConfig");

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function getDayBounds(dateString) {
  const timezone = getConfig().timezone;
  const date = dateString ? new Date(dateString) : new Date();

  if (Number.isNaN(date.getTime())) {
    throw httpError(400, "Invalid date supplied");
  }

  const dateText = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

  const start = new Date(`${dateText}T00:00:00.000Z`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  return { start, end, date: dateText };
}

function parseDateRange(query = {}) {
  const { from, to } = query;
  const config = getConfig();

  const endDate = to || new Date().toISOString().slice(0, 10);
  const startDate =
    from ||
    new Date(
      new Date(`${endDate}T00:00:00.000Z`).getTime() -
        (config.defaultReportDays - 1) * 24 * 60 * 60 * 1000,
    )
      .toISOString()
      .slice(0, 10);

  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    startDate > endDate
  ) {
    throw httpError(400, "Invalid report date range");
  }

  const days = Math.floor((end - start) / (24 * 60 * 60 * 1000)) + 1;

  if (days > config.maxReportDays) {
    throw httpError(
      400,
      `Date range cannot exceed ${config.maxReportDays} days`,
    );
  }

  return {
    start: new Date(start),
    end: new Date(end.getTime() + 24 * 60 * 60 * 1000),
    from: startDate,
    to: endDate,
  };
}

module.exports = {
  httpError,
  getDayBounds,
  parseDateRange,
};
