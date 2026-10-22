const mongoose = require('mongoose');

const performanceSchema = new mongoose.Schema(
  {
    rating: { type: Number, min: 1, max: 5, required: [true, 'Rating (1-5) is required'] },
    comment: { type: String, trim: true, maxlength: 500 },
    period: { type: String, trim: true }, // e.g. "Q3 2026"
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const employeeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    employeeId: { type: String, unique: true, required: true },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'Manager', default: null },
    department: { type: String, trim: true, default: 'General' },
    designation: { type: String, trim: true, default: 'Staff' },
    address: { type: String, trim: true, maxlength: 300 },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    dateOfBirth: { type: Date },
    dateOfJoining: { type: Date, default: Date.now },
    emergencyContact: { name: String, phone: String, relation: String },
    skills: [{ type: String, trim: true }],
    performance: [performanceSchema],
  },
  { timestamps: true }
);

employeeSchema.index({ department: 1 });
employeeSchema.index({ manager: 1 });

module.exports = mongoose.model('Employee', employeeSchema);
