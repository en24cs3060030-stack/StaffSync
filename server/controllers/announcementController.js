const Announcement = require('../models/announcementModel');
const User = require('../models/userModel');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { notify } = require('../utils/notify');
const { paginate, pageInfo, escapeRegex } = require('../utils/pagination');

// GET /api/announcements  ?category&search&page&limit  (everyone)
exports.getAnnouncements = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query, 6);
  const filter = {};
  if (req.query.category) filter.category = req.query.category;
  if (req.query.search) {
    const rx = new RegExp(escapeRegex(req.query.search), 'i');
    filter.$or = [{ title: rx }, { content: rx }];
  }
  const [data, total] = await Promise.all([
    Announcement.find(filter).populate('postedBy', 'name').sort({ isPinned: -1, createdAt: -1 }).skip(skip).limit(limit),
    Announcement.countDocuments(filter),
  ]);
  res.json({ success: true, data, pagination: pageInfo(page, limit, total) });
});

// POST /api/announcements  (HR)
exports.createAnnouncement = asyncHandler(async (req, res) => {
  const { title, content, category, isPinned } = req.body;
  if (!title || !content) throw new AppError('Title and content are required', 400);
  const a = await Announcement.create({ title, content, category, isPinned: !!isPinned, postedBy: req.user._id });

  const users = await User.find({ isActive: true, _id: { $ne: req.user._id } }).select('_id');
  await notify(users.map((u) => u._id), { title: `📢 ${a.title}`, message: a.content.slice(0, 120), type: a.category === 'Urgent' ? 'warning' : 'info', link: '/announcements' });
  res.status(201).json({ success: true, data: await a.populate('postedBy', 'name') });
});

// PUT /api/announcements/:id  (HR)
exports.updateAnnouncement = asyncHandler(async (req, res) => {
  const a = await Announcement.findById(req.params.id);
  if (!a) throw new AppError('Announcement not found', 404);
  ['title', 'content', 'category', 'isPinned'].forEach((f) => req.body[f] !== undefined && (a[f] = req.body[f]));
  await a.save();
  res.json({ success: true, data: await a.populate('postedBy', 'name') });
});

// DELETE /api/announcements/:id  (HR)
exports.deleteAnnouncement = asyncHandler(async (req, res) => {
  const a = await Announcement.findByIdAndDelete(req.params.id);
  if (!a) throw new AppError('Announcement not found', 404);
  res.json({ success: true, message: 'Announcement deleted' });
});
