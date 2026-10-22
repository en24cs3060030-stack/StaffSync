const User = require('../models/userModel');
const Employee = require('../models/employeeModel');
const Manager = require('../models/managerModel');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const profileModel = (role) => (role === 'employee' ? Employee : role === 'manager' ? Manager : null);

// GET /api/profile  - my account + my HR profile
exports.getProfile = asyncHandler(async (req, res) => {
  const Model = profileModel(req.role);
  let profile = null;
  if (Model) {
    const q = Model.findOne({ user: req.user._id });
    if (req.role === 'employee') q.populate({ path: 'manager', populate: { path: 'user', select: 'name email' } });
    profile = await q;
  }
  const u = req.user;
  res.json({ success: true, user: { _id: u._id, name: u.name, email: u.email, role: u.role, phone: u.phone, createdAt: u.createdAt }, profile });
});

// PUT /api/profile  - "Update Personal Information" (job fields like department are changed by HR only)
exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, address, gender, dateOfBirth, emergencyContact, skills } = req.body;

  if (name !== undefined) {
    if (!String(name).trim()) throw new AppError('Name cannot be empty', 400);
    req.user.name = name;
  }
  if (phone !== undefined) req.user.phone = phone;
  await req.user.save();

  const Model = profileModel(req.role);
  let profile = null;
  if (Model) {
    profile = await Model.findOne({ user: req.user._id });
    if (profile) {
      if (address !== undefined) profile.address = address;
      if (gender !== undefined) profile.gender = gender || undefined;
      if (dateOfBirth !== undefined) profile.dateOfBirth = dateOfBirth || undefined;
      if (emergencyContact !== undefined) profile.emergencyContact = emergencyContact;
      if (skills !== undefined) profile.skills = Array.isArray(skills) ? skills.map((s) => String(s).trim()).filter(Boolean) : [];
      await profile.save();
    }
  }
  res.json({ success: true, message: 'Profile updated', user: { _id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role, phone: req.user.phone }, profile });
});
