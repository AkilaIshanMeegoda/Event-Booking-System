const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  userEmail: { type: String, default: '' },
  eventId: { type: String, required: true, index: true },
  eventTitle: { type: String, required: true },
  ticketCount: { type: Number, required: true, min: 1 },
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'failed', 'refunded'],
    default: 'pending',
    index: true
  },
  paymentId: { type: String, default: null },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  bookingDate: { type: Date, default: Date.now },
  eventDate: { type: Date },
  venue: { type: String },
  cancelledAt: { type: Date },
  cancelReason: { type: String }
}, { timestamps: true });

bookingSchema.index({ userId: 1, eventId: 1 });
bookingSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Booking', bookingSchema);
