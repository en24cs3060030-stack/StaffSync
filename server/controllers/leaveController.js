const Leave = require('../models/leaveModel');
const Employee = require('../models/employeeModel');
const Attendance = require('../models/attendanceModel');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const leaveBalance = require('../utils/leaveBalance');
const { getTeamUserIds } = require('../utils/team');
const { notify, notifyRole } = require('../utils/notify');
const { paginate, pageInfo } = require('../utils/pagination');
const { toDateKey, isDateKey, daysBetween, eachDay } = require('../utils/dateUtils');
const { LEAVE_TYPES, LEAVE_QUOTA } = require('../config/constants');

// POST /api/leaves  { leaveType, startDate, endDate, reason }
exports.apply = asyncHandler(async (req, res) => {
  const { leaveType, startDate, endDate, reason } = req.body;
  if (!LEAVE_TYPES.includes(leaveType)) throw new AppError(`Leave type must be one of: ${LEAVE_TYPES.join(', ')}`, 400);
  if (!isDateKey(startDate) || !isDateKey(endDate)) throw new AppError('Valid start and end dates are required', 400);
  if (endDate < startDate) throw new AppError('End date cannot be before start date', 400);
  if (!reason || !reason.trim()) throw new AppError('Reason is required', 400);
  if (startDate < toDateKey() && leaveType !== 'Sick') throw new AppError('Only sick leave can be applied for past dates', 400);

  const days = daysBetween(startDate, endDate);
  if (days > 60) throw new AppError('A single request cannot exceed 60 days', 400);

  const overlap = await Leave.findOne({ user: req.user._id, status: { $in: ['Pending', 'Approved'] }, startDate: { $lte: endDate }, endDate: { $gte: startDate } });
  if (overlap) throw new AppError('You already have a leave request for these dates', 409);

  if (LEAVE_QUOTA[leaveType] !== undefined) {
    const b = (await leaveBalance(req.user._id, Number(startDate.slice(0, 4)))).find((x) => x.type === leaveType);
    if (days > b.remaining) throw new AppError(`Not enough ${leaveType} leave balance (${b.remaining} day(s) left)`, 400);
  }

  const leave = await Leave.create({ user: req.user._id, leaveType, startDate, endDate, days, reason });

  // tell the manager (employees with a manager) otherwise HR
  let managerUserId = null;
  if (req.role === 'employee') {
    const emp = await Employee.findOne({ user: req.user._id }).populate('manager');
    managerUserId = emp && emp.manager ? emp.manager.user : null;
  }
  const payload = { title: 'New leave request', message: `${req.user.name} applied for ${days} day(s) of ${leaveType} leave.`, type: 'info', link: '/leave-requests' };
  if (managerUserId) await notify([managerUserId], payload);
  else await notifyRole('hr', payload, req.user._id);

  res.status(201).json({ success: true, message: 'Leave request submitted', data: leave });
});

// GET /api/leaves/my  ?status&page&limit
exports.getMine = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const filter = { user: req.user._id };
  if (req.query.status) filter.status = req.query.status;
  const [data, total] = await Promise.all([
    Leave.find(filter).populate('reviewedBy', 'name').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Leave.countDocuments(filter),
  ]);
  res.json({ success: true, data, pagination: pageInfo(page, limit, total) });
});

// GET /api/leaves/balance
exports.getBalance = asyncHandler(async (req, res) => {
  res.json({ success: true, year: new Date().getFullYear(), data: await leaveBalance(req.user._id) });
});

// PUT /api/leaves/:id/cancel  - pending requests, or approved ones that have not started yet
exports.cancel = asyncHandler(async (req, res) => {
  const leave = await Leave.findOne({ _id: req.params.id, user: req.user._id });
  if (!leave) throw new AppError('Leave request not found', 404);
  const canCancel = leave.status === 'Pending' || (leave.status === 'Approved' && leave.startDate > toDateKey());
  if (!canCancel) throw new AppError(`A ${leave.status.toLowerCase()} leave cannot be cancelled`, 400);

  if (leave.status === 'Approved') {
    await Attendance.deleteMany({ user: leave.user, status: 'On Leave', date: { $gte: leave.startDate, $lte: leave.endDate } });
  }
  leave.status = 'Cancelled';
  await leave.save();
  res.json({ success: true, message: 'Leave cancelled', data: leave });
});

// GET /api/leaves  (manager = my team, HR = everyone)  ?status&page&limit
exports.getRequests = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.role === 'manager') filter.user = { $in: await getTeamUserIds(req.user._id) };
  else filter.user = { ...(filter.user || {}), $ne: req.user._id }; // HR does not review own leave here

  const [data, total] = await Promise.all([
    Leave.find(filter).populate('user', 'name email role').populate('reviewedBy', 'name').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Leave.countDocuments(filter),
  ]);
  res.json({ success: true, data, pagination: pageInfo(page, limit, total) });
});

// PUT /api/leaves/:id/review  { status: 'Approved' | 'Rejected', comment }
exports.review = asyncHandler(async (req, res) => {
  const { status, comment } = req.body;
  if (!['Approved', 'Rejected'].includes(status)) throw new AppError('Status must be Approved or Rejected', 400);

  const leave = await Leave.findById(req.params.id).populate('user', 'name');
  if (!leave) throw new AppError('Leave request not found', 404);
  if (leave.status !== 'Pending') throw new AppError(`This request is already ${leave.status.toLowerCase()}`, 400);
  if (String(leave.user._id) === String(req.user._id)) throw new AppError('You cannot review your own leave', 403);
  if (req.role === 'manager') {
    const team = (await getTeamUserIds(req.user._id)).map(String);
    if (!team.includes(String(leave.user._id))) throw new AppError('This employee is not in your team', 403);
  }

  leave.status = status;
  leave.reviewedBy = req.user._id;
  leave.reviewComment = comment;
  leave.reviewedAt = new Date();
  await leave.save();

  if (status === 'Approved') {
    // mark the days as "On Leave" (existing attendance records are left untouched)
    await Attendance.bulkWrite(
      eachDay(leave.startDate, leave.endDate).map((date) => ({
        updateOne: { filter: { user: leave.user._id, date }, update: { $setOnInsert: { status: 'On Leave', workHours: 0, note: `${leave.leaveType} leave` } }, upsert: true },
      }))
    );
  }

  await notify([leave.user._id], {
    title: `Leave ${status.toLowerCase()}`,
    message: `Your ${leave.leaveType} leave (${leave.startDate} to ${leave.endDate}) was ${status.toLowerCase()} by ${req.user.name}.${comment ? ` Note: ${comment}` : ''}`,
    type: status === 'Approved' ? 'success' : 'danger',
    link: '/leaves',
  });
  res.json({ success: true, message: `Leave ${status.toLowerCase()}`, data: leave });
});
