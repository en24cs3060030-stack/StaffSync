const jwt = require('jsonwebtoken');

const generateToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const publicUser = (u) => ({ _id: u._id, name: u.name, email: u.email, role: u.role, phone: u.phone });

// Sends token as httpOnly cookie AND in the JSON body (for Postman / mobile clients)
const sendToken = (res, statusCode, user) => {
  const token = generateToken(user._id, user.role);
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.status(statusCode).json({ success: true, token, user: publicUser(user) });
};

module.exports = { generateToken, sendToken, publicUser };
