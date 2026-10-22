const mongoose = require('mongoose');
const { ANNOUNCEMENT_CATEGORIES } = require('../config/constants');

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 120 },
    content: { type: String, required: [true, 'Content is required'], trim: true, maxlength: 3000 },
    category: { type: String, enum: ANNOUNCEMENT_CATEGORIES, default: 'General' },
    isPinned: { type: Boolean, default: false },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

announcementSchema.index({ isPinned: -1, createdAt: -1 });

module.exports = mongoose.model('Announcement', announcementSchema);
