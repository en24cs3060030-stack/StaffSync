const Notification = require('../models/notificationModel');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { paginate, pageInfo } = require('../utils/pagination');

// GET /api/notifications  ?unread=true&page&limit
exports.getNotifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query, 15);
  const filter = { user: req.user._id };
  if (req.query.unread === 'true') filter.read = false;
  const [data, total, unread] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: req.user._id, read: false }),
  ]);
  res.json({ success: true, unread, data, pagination: pageInfo(page, limit, total) });
});

// GET /api/notifications/unread-count
exports.unreadCount = asyncHandler(async (req, res) => {
  res.json({ success: true, unread: await Notification.countDocuments({ user: req.user._id, read: false }) });
});

// PUT /api/notifications/read-all
exports.markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ success: true, message: 'All notifications marked as read' });
});

// PUT /api/notifications/:id/read
exports.markRead = asyncHandler(async (req, res) => {
  const n = await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { read: true }, { new: true });
  if (!n) throw new AppError('Notification not found', 404);
  res.json({ success: true, data: n });
});

// DELETE /api/notifications/:id
exports.remove = asyncHandler(async (req, res) => {
  const n = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!n) throw new AppError('Notification not found', 404);
  res.json({ success: true, message: 'Notification deleted' });
});
