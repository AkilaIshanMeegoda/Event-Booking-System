const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  type: {
    type: String,
    enum: ['booking_confirmation', 'booking_cancellation', 'payment_success', 'payment_failed', 'payment_refund', 'review_posted', 'event_reminder', 'general'],
    required: true,
    index: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false, index: true },
  metadata: {
    bookingId: String,
    eventId: String,
    paymentId: String,
    reviewId: String
  },
  readAt: { type: Date }
}, { timestamps: true });

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
