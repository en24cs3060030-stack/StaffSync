const Leave = require('../models/leaveModel');
const { LEAVE_QUOTA, LEAVE_TYPES } = require('../config/constants');

// Leave balance for the given user and year (defaults to the current year)
module.exports = async (userId, year = new Date().getFullYear()) => {
  const rows = await Leave.aggregate([
    { $match: { user: userId, status: { $in: ['Pending', 'Approved'] }, startDate: { $regex: `^${year}` } } },
    { $group: { _id: { type: '$leaveType', status: '$status' }, days: { $sum: '$days' } } },
  ]);
  const sum = (type, status) => rows.filter((r) => r._id.type === type && (!status || r._id.status === status)).reduce((s, r) => s + r.days, 0);

  return LEAVE_TYPES.map((type) => {
    const total = LEAVE_QUOTA[type] ?? null; // null = unlimited
    const used = sum(type, 'Approved');
    const pending = sum(type, 'Pending');
    return { type, total, used, pending, remaining: total === null ? null : Math.max(total - used - pending, 0) };
  });
};
