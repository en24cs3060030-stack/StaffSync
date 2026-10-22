// HR reports & analytics
const Employee = require('../models/employeeModel');
const Manager = require('../models/managerModel');
const Attendance = require('../models/attendanceModel');
const Leave = require('../models/leaveModel');
const Training = require('../models/trainingModel');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { lastNDays, currentMonth, isMonthKey } = require('../utils/dateUtils');

// GET /api/reports/analytics?month=YYYY-MM
exports.getAnalytics = asyncHandler(async (req, res) => {
  const month = req.query.month || currentMonth();
  if (!isMonthKey(month)) throw new AppError('Month must look like 2026-10', 400);
  const days = lastNDays(7);
  const cond = (s) => ({ $sum: { $cond: [{ $eq: ['$status', s] }, 1, 0] } });

  const [empByDept, mgrByDept, leaveByType, leaveByStatus, trend, monthly, trainings] = await Promise.all([
    Employee.aggregate([{ $group: { _id: '$department', count: { $sum: 1 } } }]),
    Manager.aggregate([{ $group: { _id: '$department', count: { $sum: 1 } } }]),
    Leave.aggregate([{ $match: { status: 'Approved' } }, { $group: { _id: '$leaveType', requests: { $sum: 1 }, days: { $sum: '$days' } } }, { $sort: { _id: 1 } }]),
    Leave.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Attendance.aggregate([{ $match: { date: { $in: days } } }, { $group: { _id: { date: '$date', status: '$status' }, count: { $sum: 1 } } }]),
    Attendance.aggregate([
      { $match: { date: { $gte: `${month}-01`, $lte: `${month}-31` } } },
      { $group: { _id: '$user', present: cond('Present'), late: cond('Late'), halfDay: cond('Half Day'), onLeave: cond('On Leave'), hours: { $sum: '$workHours' } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'u' } },
      { $unwind: '$u' },
      { $project: { _id: 0, name: '$u.name', role: '$u.role', present: 1, late: 1, halfDay: 1, onLeave: 1, hours: { $round: ['$hours', 1] } } },
      { $sort: { name: 1 } },
    ]),
    Training.aggregate([{ $project: { enrolled: { $size: '$enrolled' }, endDate: 1 } }, { $group: { _id: null, total: { $sum: 1 }, enrollments: { $sum: '$enrolled' } } }]),
  ]);

  // headcount per department = employees + managers
  const headMap = {};
  [...empByDept, ...mgrByDept].forEach((d) => (headMap[d._id || 'General'] = (headMap[d._id || 'General'] || 0) + d.count));
  const headcount = Object.entries(headMap).map(([department, count]) => ({ department, count })).sort((a, b) => b.count - a.count);

  const attendanceTrend = days.map((date) => {
    const get = (s) => trend.find((t) => t._id.date === date && t._id.status === s)?.count || 0;
    return { date, present: get('Present'), late: get('Late'), halfDay: get('Half Day'), onLeave: get('On Leave') };
  });

  res.json({
    success: true, month,
    data: {
      headcount,
      leaveByType: leaveByType.map((l) => ({ type: l._id, requests: l.requests, days: l.days })),
      leaveByStatus: leaveByStatus.map((l) => ({ status: l._id, count: l.count })),
      attendanceTrend,
      monthlyAttendance: monthly,
      trainings: { total: trainings[0]?.total || 0, enrollments: trainings[0]?.enrollments || 0 },
    },
  });
});
