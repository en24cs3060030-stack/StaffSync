const User = require('../models/userModel');
const Employee = require('../models/employeeModel');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const generateId = require('../utils/generateId');
const { sendToken } = require('../utils/generateToken');
const { notifyRole } = require('../utils/notify');

const EMAIL_RE = /^\S+@\S+\.\S+$/;

// POST /api/auth/register  - public sign-up always creates an EMPLOYEE (HR creates managers / HR users)
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, department } = req.body;
  if (!name || !email || !password) throw new AppError('Name, email and password are required', 400);
  if (!EMAIL_RE.test(email)) throw new AppError('Please provide a valid email', 400);
  if (password.length < 6) throw new AppError('Password must be at least 6 characters', 400);

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) throw new AppError('Email is already registered', 409);

  const user = await User.create({ name, email, password, phone, role: 'employee' });
  try {
    await Employee.create({
      user: user._id,
      employeeId: await generateId(Employee, 'employeeId', 'EMP'),
      department: department || 'General',
    });
  } catch (err) {
    await User.findByIdAndDelete(user._id); // do not leave a half-created account
    throw err;
  }

  notifyRole('hr', { title: 'New employee registered', message: `${user.name} has joined StaffSync.`, type: 'info', link: '/hr/employees' }).catch(() => {});
  sendToken(res, 201, user);
});

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new AppError('Email and password are required', 400);

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(password))) throw new AppError('Invalid email or password', 401);
  if (!user.isActive) throw new AppError('Your account has been deactivated', 403);

  user.lastLogin = new Date();
  await user.save();
  sendToken(res, 200, user);
});

// POST /api/auth/logout
exports.logout = asyncHandler(async (req, res) => {
  res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
  res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/auth/me
exports.getMe = asyncHandler(async (req, res) => {
  const u = req.user;
  res.json({ success: true, user: { _id: u._id, name: u.name, email: u.email, role: u.role, phone: u.phone } });
});

// PUT /api/auth/password
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) throw new AppError('Current and new password are required', 400);
  if (newPassword.length < 6) throw new AppError('New password must be at least 6 characters', 400);

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(currentPassword))) throw new AppError('Current password is incorrect', 400);
  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Password updated' });
});
