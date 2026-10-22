const mongoose = require('mongoose');
const { ATTENDANCE_STATUS } = require('../config/constants');

const attendanceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ }, // "YYYY-MM-DD"
    checkIn: { type: Date },
    checkOut: { type: Date },
    workHours: { type: Number, default: 0 },
    status: { type: String, enum: ATTENDANCE_STATUS, default: 'Present' },
    note: { type: String, trim: true, maxlength: 200 },
  },
  { timestamps: true }
);

// one record per person per day
attendanceSchema.index({ user: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1, status: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
