const Notification = require('../models/notificationModel');
const User = require('../models/userModel');

// notify([userId, ...], { title, message, type, link })
const notify = async (userIds, { title, message, type = 'info', link = '' }) => {
  const ids = [...new Set(userIds.filter(Boolean).map(String))];
  if (!ids.length) return;
  await Notification.insertMany(ids.map((user) => ({ user, title, message, type, link })));
};

const notifyRole = async (role, payload, excludeId) => {
  const users = await User.find({ role, isActive: true, ...(excludeId ? { _id: { $ne: excludeId } } : {}) }).select('_id');
  return notify(users.map((u) => u._id), payload);
};

module.exports = { notify, notifyRole };
