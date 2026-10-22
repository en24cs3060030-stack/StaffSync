// Manager: team members, team attendance and performance monitoring
const Employee = require('../models/employeeModel');
const Attendance = require('../models/attendanceModel');
const Leave = require('../models/leaveModel');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { getTeam } = require('../utils/team');
const { notify } = require('../utils/notify');
const { toDateKey, isDateKey } = require('../utils/dateUtils');

const requireManagerProfile = async (userId) => {
  const t = await getTeam(userId);
  if (!t.manager) throw new AppError('Manager profile not found, please contact HR', 404);
  return t;
};

// GET /api/team  - my team + today's attendance status for each member
exports.getTeamMembers = asyncHandler(async (req, res) => {
  const { members } = await requireManagerProfile(req.user._id);
  const today = toDateKey();
  const userIds = members.map((m) => m.user._id);
  const att = await Attendance.find({ user: { $in: userIds }, date: today });
  const byUser = Object.fromEntries(att.map((a) => [String(a.user), a.status]));
  const data = members.map((m) => ({ ...m.toObject(), todayStatus: byUser[String(m.user._id)] || 'Not marked' }));
  res.json({ success: true, data });
});

// GET /api/team/unassigned  - employees without a manager (to add to my team)
exports.getUnassigned = asyncHandler(async (req, res) => {
  const data = await Employee.find({ manager: null }).populate('user', 'name email isActive').select('employeeId user department designation');
  res.json({ success: true, data });
});

// POST /api/team/members  { employeeId }
exports.addMember = asyncHandler(async (req, res) => {
  const { manager } = await requireManagerProfile(req.user._id);
  const emp = await Employee.findById(req.body.employeeId).populate('user', 'name');
  if (!emp) throw new AppError('Employee not found', 404);
  if (emp.manager) throw new AppError('Employee already belongs to a team', 400);
  emp.manager = manager._id;
  await emp.save();
  await notify([emp.user._id], { title: 'Added to a team', message: `${req.user.name} is now your manager.`, type: 'info', link: '/profile' });
  res.json({ success: true, message: `${emp.user.name} added to your team` });
});

// DELETE /api/team/members/:id
exports.removeMember = asyncHandler(async (req, res) => {
  const { manager } = await requireManagerProfile(req.user._id);
  const emp = await Employee.findOne({ _id: req.params.id, manager: manager._id });
  if (!emp) throw new AppError('Team member not found', 404);
  emp.manager = null;
  await emp.save();
  res.json({ success: true, message: 'Member removed from your team' });
});

// GET /api/team/attendance?date=YYYY-MM-DD
exports.getTeamAttendance = asyncHandler(async (req, res) => {
  const { members } = await requireManagerProfile(req.user._id);
  const date = req.query.date || toDateKey();
  if (!isDateKey(date)) throw new AppError('Invalid date', 400);
  const att = await Attendance.find({ user: { $in: members.map((m) => m.user._id) }, date });
  const byUser = Object.fromEntries(att.map((a) => [String(a.user), a]));
  const data = members.map((m) => {
    const a = byUser[String(m.user._id)];
    return {
      employee: m._id, employeeId: m.employeeId, name: m.user.name, department: m.department,
      status: a ? a.status : 'Not marked', checkIn: a?.checkIn || null, checkOut: a?.checkOut || null, workHours: a?.workHours || 0,
    };
  });
  res.json({ success: true, date, data });
});

// GET /api/team/:id  - one member with performance history and recent leaves
exports.getMember = asyncHandler(async (req, res) => {
  const { manager } = await requireManagerProfile(req.user._id);
  const emp = await Employee.findOne({ _id: req.params.id, manager: manager._id })
    .populate('user', 'name email phone')
    .populate('performance.reviewedBy', 'name');
  if (!emp) throw new AppError('Team member not found', 404);
  const leaves = await Leave.find({ user: emp.user._id }).sort({ createdAt: -1 }).limit(5);
  res.json({ success: true, data: emp, leaves });
});

// POST /api/team/:id/performance  { rating, comment, period }
exports.addPerformance = asyncHandler(async (req, res) => {
  const { manager } = await requireManagerProfile(req.user._id);
  const emp = await Employee.findOne({ _id: req.params.id, manager: manager._id });
  if (!emp) throw new AppError('Team member not found', 404);
  const rating = Number(req.body.rating);
  if (!rating || rating < 1 || rating > 5) throw new AppError('Rating must be between 1 and 5', 400);

  emp.performance.push({ rating, comment: req.body.comment, period: req.body.period, reviewedBy: req.user._id });
  await emp.save();
  await notify([emp.user], { title: 'New performance review', message: `${req.user.name} added a performance review (${rating}/5).`, type: 'info', link: '/profile' });
  res.status(201).json({ success: true, data: emp.performance });
});
