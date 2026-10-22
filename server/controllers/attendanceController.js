const Attendance = require('../models/attendanceModel');
const Leave = require('../models/leaveModel');
const User = require('../models/userModel');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { paginate, pageInfo, escapeRegex } = require('../utils/pagination');
const { toDateKey, isDateKey, isMonthKey, currentMonth } = require('../utils/dateUtils');
const { ATTENDANCE_STATUS } = require('../config/constants');

const summarize = (records) => {
  const s = { Present: 0, Late: 0, 'Half Day': 0, Absent: 0, 'On Leave': 0, totalHours: 0 };
  records.forEach((r) => {
    s[r.status] = (s[r.status] || 0) + 1;
    s.totalHours += r.workHours || 0;
  });
  s.totalHours = Math.round(s.totalHours * 100) / 100;
  return s;
};

// GET /api/attendance/today
exports.getToday = asyncHandler(async (req, res) => {
  const record = await Attendance.findOne({ user: req.user._id, date: toDateKey() });
  res.json({ success: true, data: record });
});

// POST /api/attendance/check-in
exports.checkIn = asyncHandler(async (req, res) => {
  const today = toDateKey();
  const onLeave = await Leave.findOne({ user: req.user._id, status: 'Approved', startDate: { $lte: today }, endDate: { $gte: today } });
  if (onLeave) throw new AppError('You are on approved leave today', 400);

  const existing = await Attendance.findOne({ user: req.user._id, date: today });
  if (existing && existing.checkIn) throw new AppError('You have already checked in today', 400);

  const now = new Date();
  const [h, m] = (process.env.LATE_AFTER || '10:15').split(':').map(Number);
  const late = now.getHours() * 60 + now.getMinutes() > h * 60 + m;

  const record = await Attendance.create({ user: req.user._id, date: today, checkIn: now, status: late ? 'Late' : 'Present' });
  res.status(201).json({ success: true, message: late ? 'Checked in (marked late)' : 'Checked in', data: record });
});

// POST /api/attendance/check-out
exports.checkOut = asyncHandler(async (req, res) => {
  const record = await Attendance.findOne({ user: req.user._id, date: toDateKey() });
  if (!record || !record.checkIn) throw new AppError('Please check in first', 400);
  if (record.checkOut) throw new AppError('You have already checked out today', 400);

  record.checkOut = new Date();
  record.workHours = Math.round(((record.checkOut - record.checkIn) / 36e5) * 100) / 100;
  if (record.workHours < (Number(process.env.HALF_DAY_HOURS) || 4)) record.status = 'Half Day';
  await record.save();
  res.json({ success: true, message: 'Checked out', data: record });
});

// GET /api/attendance/my?month=YYYY-MM
exports.getMine = asyncHandler(async (req, res) => {
  const month = req.query.month || currentMonth();
  if (!isMonthKey(month)) throw new AppError('Month must look like 2026-10', 400);
  const data = await Attendance.find({ user: req.user._id, date: { $gte: `${month}-01`, $lte: `${month}-31` } }).sort({ date: -1 });
  res.json({ success: true, month, summary: summarize(data), data });
});

// GET /api/attendance  (HR) ?date|month&status&search&page&limit
exports.getAll = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query, 15);
  const filter = {};
  if (req.query.date) {
    if (!isDateKey(req.query.date)) throw new AppError('Invalid date', 400);
    filter.date = req.query.date;
  } else if (req.query.month) {
    if (!isMonthKey(req.query.month)) throw new AppError('Month must look like 2026-10', 400);
    filter.date = { $gte: `${req.query.month}-01`, $lte: `${req.query.month}-31` };
  }
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) {
    const rx = new RegExp(escapeRegex(req.query.search), 'i');
    filter.user = { $in: await User.find({ $or: [{ name: rx }, { email: rx }] }).distinct('_id') };
  }
  const [data, total] = await Promise.all([
    Attendance.find(filter).populate('user', 'name email role').sort({ date: -1, createdAt: -1 }).skip(skip).limit(limit),
    Attendance.countDocuments(filter),
  ]);
  res.json({ success: true, data, pagination: pageInfo(page, limit, total) });
});

// POST /api/attendance/manual  (HR)  { user, date, status, checkIn?, checkOut?, note? }
exports.manualMark = asyncHandler(async (req, res) => {
  const { user, date, status, checkIn, checkOut, note } = req.body;
  if (!user || !date || !status) throw new AppError('user, date and status are required', 400);
  if (!isDateKey(date)) throw new AppError('Invalid date', 400);
  if (!ATTENDANCE_STATUS.includes(status)) throw new AppError('Invalid status', 400);
  if (!(await User.exists({ _id: user }))) throw new AppError('User not found', 404);

  const update = { status, note };
  if (checkIn) update.checkIn = new Date(`${date}T${checkIn}`);
  if (checkOut) update.checkOut = new Date(`${date}T${checkOut}`);
  if (update.checkIn && update.checkOut) update.workHours = Math.max(Math.round(((update.checkOut - update.checkIn) / 36e5) * 100) / 100, 0);

  const record = await Attendance.findOneAndUpdate({ user, date }, { $set: update }, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true });
  res.json({ success: true, message: 'Attendance saved', data: record });
});

// DELETE /api/attendance/:id  (HR)
exports.remove = asyncHandler(async (req, res) => {
  const record = await Attendance.findByIdAndDelete(req.params.id);
  if (!record) throw new AppError('Record not found', 404);
  res.json({ success: true, message: 'Record deleted' });
});
