// One controller factory used for both Employees and Managers (HR manages both the same way)
const User = require('../models/userModel');
const Employee = require('../models/employeeModel');
const Manager = require('../models/managerModel');
const Attendance = require('../models/attendanceModel');
const Leave = require('../models/leaveModel');
const Notification = require('../models/notificationModel');
const Training = require('../models/trainingModel');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const generateId = require('../utils/generateId');
const { paginate, pageInfo, escapeRegex } = require('../utils/pagination');

const PROFILE_FIELDS = ['department', 'designation', 'address', 'gender', 'dateOfBirth', 'dateOfJoining', 'emergencyContact', 'skills'];
const SKIP_IF_EMPTY = ['gender', 'dateOfBirth', 'dateOfJoining'];

const pickProfile = (body) => {
  const out = {};
  PROFILE_FIELDS.forEach((f) => {
    if (body[f] === undefined) return;
    if (body[f] === '' && SKIP_IF_EMPTY.includes(f)) return;
    out[f] = body[f];
  });
  return out;
};

module.exports = ({ Model, role, idField, prefix }) => {
  const isEmp = role === 'employee';
  const populate = isEmp
    ? [{ path: 'user', select: 'name email phone isActive lastLogin' }, { path: 'manager', populate: { path: 'user', select: 'name' } }]
    : [{ path: 'user', select: 'name email phone isActive lastLogin' }];

  // GET /  ?search&department&manager&page&limit
  const list = asyncHandler(async (req, res) => {
    const { page, limit, skip } = paginate(req.query);
    const filter = {};
    if (req.query.department) filter.department = req.query.department;
    if (isEmp && req.query.manager) filter.manager = req.query.manager;
    if (req.query.search) {
      const rx = new RegExp(escapeRegex(req.query.search), 'i');
      const ids = await User.find({ role, $or: [{ name: rx }, { email: rx }] }).distinct('_id');
      filter.$or = [{ user: { $in: ids } }, { [idField]: rx }];
    }
    const [data, total] = await Promise.all([
      Model.find(filter).populate(populate).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Model.countDocuments(filter),
    ]);
    res.json({ success: true, data, pagination: pageInfo(page, limit, total) });
  });

  // GET /all  - light list for dropdowns (no pagination)
  const options = asyncHandler(async (req, res) => {
    const data = await Model.find().populate('user', 'name').select(`${idField} user department`).sort({ createdAt: -1 });
    res.json({ success: true, data });
  });

  const getOne = asyncHandler(async (req, res) => {
    const doc = await Model.findById(req.params.id).populate(populate);
    if (!doc) throw new AppError(`${role} not found`, 404);
    res.json({ success: true, data: doc });
  });

  // POST /  - HR creates the account + profile
  const create = asyncHandler(async (req, res) => {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) throw new AppError('Name, email and password are required', 400);
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new AppError('Please provide a valid email', 400);
    if (password.length < 6) throw new AppError('Password must be at least 6 characters', 400);
    if (await User.findOne({ email: email.toLowerCase() })) throw new AppError('Email is already registered', 409);
    if (isEmp && req.body.manager && !(await Manager.findById(req.body.manager))) throw new AppError('Selected manager does not exist', 400);

    const user = await User.create({ name, email, password, phone, role });
    let doc;
    try {
      doc = await Model.create({
        user: user._id,
        [idField]: await generateId(Model, idField, prefix),
        ...pickProfile(req.body),
        ...(isEmp && req.body.manager ? { manager: req.body.manager } : {}),
      });
    } catch (err) {
      await User.findByIdAndDelete(user._id);
      throw err;
    }
    res.status(201).json({ success: true, data: await doc.populate(populate) });
  });

  // PUT /:id
  const update = asyncHandler(async (req, res) => {
    const doc = await Model.findById(req.params.id);
    if (!doc) throw new AppError(`${role} not found`, 404);
    const user = await User.findById(doc.user);

    const { name, email, phone, isActive, password } = req.body;
    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (isActive !== undefined) user.isActive = !!isActive;
    if (email && email.toLowerCase() !== user.email) {
      if (!/^\S+@\S+\.\S+$/.test(email)) throw new AppError('Please provide a valid email', 400);
      if (await User.findOne({ email: email.toLowerCase(), _id: { $ne: user._id } })) throw new AppError('Email is already registered', 409);
      user.email = email;
    }
    if (password) {
      if (password.length < 6) throw new AppError('Password must be at least 6 characters', 400);
      user.password = password; // hashed by the pre-save hook
    }
    await user.save();

    Object.assign(doc, pickProfile(req.body));
    if (isEmp && req.body.manager !== undefined) {
      if (req.body.manager && !(await Manager.findById(req.body.manager))) throw new AppError('Selected manager does not exist', 400);
      doc.manager = req.body.manager || null;
    }
    await doc.save();
    res.json({ success: true, data: await doc.populate(populate) });
  });

  // DELETE /:id  - removes the person and everything that belongs to them
  const remove = asyncHandler(async (req, res) => {
    const doc = await Model.findById(req.params.id);
    if (!doc) throw new AppError(`${role} not found`, 404);
    const userId = doc.user;

    if (!isEmp) await Employee.updateMany({ manager: doc._id }, { manager: null }); // team becomes unassigned
    await Promise.all([
      Attendance.deleteMany({ user: userId }),
      Leave.deleteMany({ user: userId }),
      Notification.deleteMany({ user: userId }),
      Training.updateMany({ enrolled: userId }, { $pull: { enrolled: userId } }),
    ]);
    await Model.findByIdAndDelete(doc._id);
    await User.findByIdAndDelete(userId);
    res.json({ success: true, message: `${role} deleted` });
  });

  return { list, options, getOne, create, update, remove };
};

module.exports.pickProfile = pickProfile;
