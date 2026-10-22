const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// Verifies the JWT (cookie or "Authorization: Bearer <token>") and attaches the user to req
const protect = asyncHandler(async (req, res, next) => {
  let token = req.cookies && req.cookies.token;
  const header = req.headers.authorization;
  if (!token && header && header.startsWith('Bearer ')) token = header.split(' ')[1];
  if (!token) throw new AppError('Not authorised, please log in', 401);

  const decoded = jwt.verify(token, process.env.JWT_SECRET); // JWT errors handled in errorMiddleware
  const user = await User.findById(decoded.id);
  if (!user) throw new AppError('User no longer exists', 401);
  if (!user.isActive) throw new AppError('Your account has been deactivated', 403);

  req.user = user;
  req.role = user.role;
  next();
});

// Role-based access control: router.get('/', protect, authorize('hr', 'manager'), handler)
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.role)) return next(new AppError('You do not have permission to do this', 403));
  next();
};

module.exports = { protect, authorize };
