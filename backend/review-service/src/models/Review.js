const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  userName: { type: String, required: true },
  eventId: { type: String, required: true, index: true },
  eventTitle: { type: String },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, required: true, maxlength: 200 },
  comment: { type: String, required: true, maxlength: 2000 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Each user can only review an event once
reviewSchema.index({ userId: 1, eventId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
