const mongoose = require('mongoose');
const { LEAVE_TYPES } = require('../config/constants');

const leaveSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    leaveType: { type: String, enum: LEAVE_TYPES, required: [true, 'Leave type is required'] },
    startDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    endDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    days: { type: Number, required: true, min: 1 },
    reason: { type: String, required: [true, 'Reason is required'], trim: true, maxlength: 500 },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'], default: 'Pending' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewComment: { type: String, trim: true, maxlength: 300 },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

leaveSchema.index({ user: 1, status: 1 });
leaveSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Leave', leaveSchema);
