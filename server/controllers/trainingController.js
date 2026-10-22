const Training = require('../models/trainingModel');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { getTeamUserIds } = require('../utils/team');
const { notify, notifyRole } = require('../utils/notify');
const { paginate, pageInfo, escapeRegex } = require('../utils/pagination');

const FIELDS = ['title', 'description', 'trainer', 'mode', 'location', 'startDate', 'endDate', 'capacity'];

// hide the enrolled list from normal lists, expose counts + "am I enrolled"
const present = (t, userId) => {
  const o = t.toJSON();
  o.enrolledCount = t.enrolled.length;
  o.isEnrolled = t.enrolled.some((id) => String(id) === String(userId));
  delete o.enrolled;
  return o;
};

// GET /api/trainings  ?status=Upcoming|Ongoing|Completed&search&mine=true&enrolled=true&page&limit
exports.getTrainings = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query, 6);
  const now = new Date();
  const filter = {};
  const { status, search, mine, enrolled } = req.query;
  if (status === 'Upcoming') filter.startDate = { $gt: now };
  else if (status === 'Completed') filter.endDate = { $lt: now };
  else if (status === 'Ongoing') Object.assign(filter, { startDate: { $lte: now }, endDate: { $gte: now } });
  if (search) filter.title = new RegExp(escapeRegex(search), 'i');
  if (mine === 'true') filter.createdBy = req.user._id;
  if (enrolled === 'true') filter.enrolled = req.user._id;

  const [docs, total] = await Promise.all([
    Training.find(filter).populate('createdBy', 'name').sort({ startDate: -1 }).skip(skip).limit(limit),
    Training.countDocuments(filter),
  ]);
  res.json({ success: true, data: docs.map((d) => present(d, req.user._id)), pagination: pageInfo(page, limit, total) });
});

// GET /api/trainings/:id  (manager / HR) - with the list of participants
exports.getTraining = asyncHandler(async (req, res) => {
  const t = await Training.findById(req.params.id).populate('createdBy', 'name').populate('enrolled', 'name email role');
  if (!t) throw new AppError('Training not found', 404);
  res.json({ success: true, data: t });
});

const validateDates = (start, end) => {
  if (isNaN(new Date(start)) || isNaN(new Date(end))) throw new AppError('Valid start and end dates are required', 400);
  if (new Date(end) < new Date(start)) throw new AppError('End date cannot be before start date', 400);
};

// POST /api/trainings  (manager / HR)
exports.createTraining = asyncHandler(async (req, res) => {
  const { title, startDate, endDate } = req.body;
  if (!title) throw new AppError('Title is required', 400);
  validateDates(startDate, endDate);

  const data = {};
  FIELDS.forEach((f) => req.body[f] !== undefined && req.body[f] !== '' && (data[f] = req.body[f]));
  const t = await Training.create({ ...data, createdBy: req.user._id });
  await notifyRole('employee', { title: 'New training programme', message: `${t.title} starts on ${new Date(t.startDate).toLocaleDateString()}.`, type: 'info', link: '/trainings' });
  res.status(201).json({ success: true, data: present(t, req.user._id) });
});

const loadEditable = async (req) => {
  const t = await Training.findById(req.params.id);
  if (!t) throw new AppError('Training not found', 404);
  if (req.role === 'manager' && String(t.createdBy) !== String(req.user._id)) throw new AppError('You can only manage trainings you created', 403);
  return t;
};

// PUT /api/trainings/:id
exports.updateTraining = asyncHandler(async (req, res) => {
  const t = await loadEditable(req);
  FIELDS.forEach((f) => req.body[f] !== undefined && (t[f] = req.body[f]));
  validateDates(t.startDate, t.endDate);
  if (t.capacity < t.enrolled.length) throw new AppError('Capacity cannot be lower than the number already enrolled', 400);
  await t.save();
  res.json({ success: true, data: present(t, req.user._id) });
});

// DELETE /api/trainings/:id
exports.deleteTraining = asyncHandler(async (req, res) => {
  const t = await loadEditable(req);
  await notify(t.enrolled, { title: 'Training cancelled', message: `${t.title} has been cancelled.`, type: 'warning', link: '/trainings' });
  await t.deleteOne();
  res.json({ success: true, message: 'Training deleted' });
});

// POST /api/trainings/:id/enroll
exports.enroll = asyncHandler(async (req, res) => {
  const t = await Training.findById(req.params.id);
  if (!t) throw new AppError('Training not found', 404);
  if (t.status === 'Completed') throw new AppError('This training has already finished', 400);

  const updated = await Training.findOneAndUpdate(
    { _id: t._id, enrolled: { $ne: req.user._id }, $expr: { $lt: [{ $size: '$enrolled' }, '$capacity'] } },
    { $addToSet: { enrolled: req.user._id } },
    { new: true }
  );
  if (!updated) throw new AppError('You are already enrolled or the training is full', 400);
  res.json({ success: true, message: 'Enrolled successfully', data: present(updated, req.user._id) });
});

// POST /api/trainings/:id/unenroll
exports.unenroll = asyncHandler(async (req, res) => {
  const t = await Training.findByIdAndUpdate(req.params.id, { $pull: { enrolled: req.user._id } }, { new: true });
  if (!t) throw new AppError('Training not found', 404);
  res.json({ success: true, message: 'You have left this training', data: present(t, req.user._id) });
});

// POST /api/trainings/:id/assign  { userIds: [] }  (manager: own team only, HR: anyone)
exports.assign = asyncHandler(async (req, res) => {
  const t = await loadEditable(req);
  let ids = (req.body.userIds || []).map(String);
  if (!ids.length) throw new AppError('Select at least one person', 400);
  if (req.role === 'manager') {
    const team = (await getTeamUserIds(req.user._id)).map(String);
    ids = ids.filter((id) => team.includes(id));
    if (!ids.length) throw new AppError('You can only assign your own team members', 403);
  }
  const fresh = ids.filter((id) => !t.enrolled.map(String).includes(id));
  if (t.enrolled.length + fresh.length > t.capacity) throw new AppError('Not enough seats left in this training', 400);

  t.enrolled.push(...fresh);
  await t.save();
  await notify(fresh, { title: 'Training assigned', message: `You were enrolled in "${t.title}".`, type: 'info', link: '/trainings' });
  res.json({ success: true, message: `${fresh.length} person(s) enrolled`, data: present(t, req.user._id) });
});
