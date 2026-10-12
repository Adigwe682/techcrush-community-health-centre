// "Today" must mean today in the CLINIC's timezone, not server UTC,
// otherwise evening visits land on the wrong day.

import { getConfig } from "./dashboardConfig.js";

export const httpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

function localParts(date, timeZone) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const p = Object.fromEntries(
    formatter.formatToParts(date).map((part) => [part.type, part.value])
  );

  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour, mi: +p.minute, s: +p.second };
}

function offsetMs(date, timeZone) {
  const p = localParts(date, timeZone);
  const asUTC = Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s);
  return asUTC - Math.floor(date.getTime() / 1000) * 1000;
}

// Real instant at which the given calendar date starts in the clinic timezone.
export function startOfLocalDate(y, m, d, timeZone = getConfig().timezone) {
  const guess = new Date(Date.UTC(y, m - 1, d));
  return new Date(guess.getTime() - offsetMs(guess, timeZone));
}

export function toLocalYMD(date, timeZone = getConfig().timezone) {
  const { y, m, d } = localParts(date, timeZone);
  return { y, m, d };
}

const fmt = ({ y, m, d }) =>
  `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

// [start, end) bounds of the clinic day containing `date`.
export function getDayBounds(date = new Date(), timeZone = getConfig().timezone) {
  const { y, m, d } = toLocalYMD(date, timeZone);
  return {
    start: startOfLocalDate(y, m, d, timeZone),
    end: startOfLocalDate(y, m, d + 1, timeZone),
  };
}

const YMD = /^\d{4}-\d{2}-\d{2}$/;

function parseYMD(value, label) {
  if (!YMD.test(value)) throw httpError(400, `"${label}" must be in YYYY-MM-DD format`);

  const [y, m, d] = value.split("-").map(Number);
  const check = new Date(Date.UTC(y, m - 1, d));

  if (check.getUTCMonth() !== m - 1 || check.getUTCDate() !== d) {
    throw httpError(400, `"${label}" is not a valid date`);
  }

  return { y, m, d };
}

// Parses ?from=YYYY-MM-DD&to=YYYY-MM-DD (both inclusive, clinic timezone).
// Defaults to the last 30 days ending today.
export function parseDateRange({ from, to } = {}, now = new Date()) {
  const { timezone, maxReportDays, defaultReportDays } = getConfig();

  const toYMD = to ? parseYMD(to, "to") : toLocalYMD(now, timezone);

  let fromYMD;
  if (from) {
    fromYMD = parseYMD(from, "from");
  } else {
    const base = new Date(Date.UTC(toYMD.y, toYMD.m - 1, toYMD.d - (defaultReportDays - 1)));
    fromYMD = { y: base.getUTCFullYear(), m: base.getUTCMonth() + 1, d: base.getUTCDate() };
  }

  const start = startOfLocalDate(fromYMD.y, fromYMD.m, fromYMD.d, timezone);
  const end = startOfLocalDate(toYMD.y, toYMD.m, toYMD.d + 1, timezone);

  if (start >= end) throw httpError(400, '"from" must be on or before "to"');

  const days = Math.round((end - start) / 86400000);
  if (days > maxReportDays) throw httpError(400, `Date range cannot exceed ${maxReportDays} days`);

  return { from: fmt(fromYMD), to: fmt(toYMD), start, end, days };
}