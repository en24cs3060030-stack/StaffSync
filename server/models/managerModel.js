const mongoose = require('mongoose');

const managerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    managerId: { type: String, unique: true, required: true },
    department: { type: String, trim: true, default: 'General' },
    designation: { type: String, trim: true, default: 'Manager' },
    address: { type: String, trim: true, maxlength: 300 },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    dateOfBirth: { type: Date },
    dateOfJoining: { type: Date, default: Date.now },
    emergencyContact: { name: String, phone: String, relation: String },
    skills: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

managerSchema.index({ department: 1 });

module.exports = mongoose.model('Manager', managerSchema);
