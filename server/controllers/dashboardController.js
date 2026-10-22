// GET /api/dashboard  - returns different numbers depending on who is logged in
const User = require('../models/userModel');
const Employee = require('../models/employeeModel');
const Manager = require('../models/managerModel');
const Attendance = require('../models/attendanceModel');
const Leave = require('../models/leaveModel');
const Announcement = require('../models/announcementModel');
const Training = require('../models/trainingModel');
const Notification = require('../models/notificationModel');
const asyncHandler = require('../utils/asyncHandler');
const leaveBalance = require('../utils/leaveBalance');
const { getTeam } = require('../utils/team');
const { toDateKey, currentMonth } = require('../utils/dateUtils');

const PRESENT = ['Present', 'Late', 'Half Day'];

const latestAnnouncements = () => Announcement.find().populate('postedBy', 'name').sort({ isPinned: -1, createdAt: -1 }).limit(3);

exports.getDashboard = asyncHandler(async (req, res) => {
  const today = toDateKey();
  const now = new Date();
  const uid = req.user._id;
  const common = {
    myToday: await Attendance.findOne({ user: uid, date: today }),
    unreadNotifications: await Notification.countDocuments({ user: uid, read: false }),
    announcements: await latestAnnouncements(),
  };

  if (req.role === 'employee') {
    const month = currentMonth();
    const [balance, pendingLeaves, trainings, monthRecords, recentLeaves] = await Promise.all([
      leaveBalance(uid),
      Leave.countDocuments({ user: uid, status: 'Pending' }),
      Training.find({ enrolled: uid, endDate: { $gte: now } }).sort({ startDate: 1 }).limit(3).select('title startDate endDate mode location'),
      Attendance.find({ user: uid, date: { $gte: `${month}-01`, $lte: `${month}-31` } }),
      Leave.find({ user: uid }).sort({ createdAt: -1 }).limit(3),
    ]);
    const monthSummary = { present: monthRecords.filter((r) => PRESENT.includes(r.status)).length, late: monthRecords.filter((r) => r.status === 'Late').length, onLeave: monthRecords.filter((r) => r.status === 'On Leave').length };
    return res.json({ success: true, role: 'employee', data: { ...common, balance, pendingLeaves, trainings, monthSummary, recentLeaves } });
  }

  if (req.role === 'manager') {
    const { members } = await getTeam(uid);
    const teamIds = members.map((m) => m.user._id);
    const [teamToday, pendingLeaves, upcomingTrainings, myTrainings, balance, pendingList] = await Promise.all([
      Attendance.find({ user: { $in: teamIds }, date: today }),
      Leave.countDocuments({ user: { $in: teamIds }, status: 'Pending' }),
      Training.countDocuments({ createdBy: uid, endDate: { $gte: now } }),
      Training.countDocuments({ createdBy: uid }),
      leaveBalance(uid),
      Leave.find({ user: { $in: teamIds }, status: 'Pending' }).populate('user', 'name').sort({ createdAt: -1 }).limit(5),
    ]);
    const ratings = members.flatMap((m) => m.performance.map((p) => p.rating));
    return res.json({
      success: true, role: 'manager',
      data: {
        ...common, balance, pendingList,
        teamSize: members.length,
        presentToday: teamToday.filter((a) => PRESENT.includes(a.status)).length,
        lateToday: teamToday.filter((a) => a.status === 'Late').length,
        onLeaveToday: teamToday.filter((a) => a.status === 'On Leave').length,
        notMarked: members.length - teamToday.length,
        pendingLeaves, upcomingTrainings, totalTrainings: myTrainings,
        avgRating: ratings.length ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : null,
      },
    });
  }

  // HR
  const [employees, managers, todayRecs, pendingLeaves, upcomingTrainings, pendingList, recentHires, staff] = await Promise.all([
    Employee.countDocuments(),
    Manager.countDocuments(),
    Attendance.find({ date: today }),
    Leave.countDocuments({ status: 'Pending' }),
    Training.countDocuments({ endDate: { $gte: now } }),
    Leave.find({ status: 'Pending' }).populate('user', 'name role').sort({ createdAt: -1 }).limit(5),
    Employee.find().populate('user', 'name').sort({ createdAt: -1 }).limit(5).select('employeeId user department designation createdAt'),
    User.countDocuments({ role: { $in: ['employee', 'manager'] }, isActive: true }),
  ]);
  const marked = todayRecs.filter((a) => a.status !== 'On Leave').length;
  res.json({
    success: true, role: 'hr',
    data: {
      ...common, employees, managers, pendingLeaves, upcomingTrainings, pendingList, recentHires,
      presentToday: todayRecs.filter((a) => PRESENT.includes(a.status)).length,
      lateToday: todayRecs.filter((a) => a.status === 'Late').length,
      onLeaveToday: todayRecs.filter((a) => a.status === 'On Leave').length,
      notMarked: Math.max(staff - marked - todayRecs.filter((a) => a.status === 'On Leave').length, 0),
    },
  });
});
