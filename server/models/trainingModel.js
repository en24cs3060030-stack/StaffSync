const mongoose = require('mongoose');
const { TRAINING_MODES } = require('../config/constants');

const trainingSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000 },
    trainer: { type: String, trim: true },
    mode: { type: String, enum: TRAINING_MODES, default: 'Online' },
    location: { type: String, trim: true }, // room / meeting link
    startDate: { type: Date, required: [true, 'Start date is required'] },
    endDate: { type: Date, required: [true, 'End date is required'] },
    capacity: { type: Number, default: 30, min: 1 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    enrolled: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

trainingSchema.index({ startDate: 1 });
trainingSchema.index({ createdBy: 1 });

// Upcoming / Ongoing / Completed - calculated from dates, never stored
trainingSchema.virtual('status').get(function () {
  const now = new Date();
  if (now < this.startDate) return 'Upcoming';
  if (now > this.endDate) return 'Completed';
  return 'Ongoing';
});

module.exports = mongoose.model('Training', trainingSchema);
