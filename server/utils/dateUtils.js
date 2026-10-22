// Dates are handled as "YYYY-MM-DD" strings for attendance and leaves (no timezone surprises)
const pad = (n) => String(n).padStart(2, '0');

const toDateKey = (d = new Date()) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
};

const parseKey = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

// round-trip check rejects impossible dates such as 2026-02-31
const isDateKey = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && toDateKey(parseKey(s)) === s;

// inclusive number of days between two keys
const daysBetween = (a, b) => Math.round((parseKey(b) - parseKey(a)) / 86400000) + 1;

const eachDay = (a, b) => {
  const out = [];
  for (let d = parseKey(a); toDateKey(d) <= b; d.setDate(d.getDate() + 1)) out.push(toDateKey(d));
  return out;
};

const lastNDays = (n) => {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(toDateKey(d));
  }
  return out;
};

const currentMonth = () => toDateKey().slice(0, 7); // "YYYY-MM"
const isMonthKey = (s) => typeof s === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(s);

module.exports = { toDateKey, parseKey, isDateKey, daysBetween, eachDay, lastNDays, currentMonth, isMonthKey };
