const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true },
    description: { type: String, required: [true, 'Description is required'] },
    category: {
      type: String,
      required: true,
      enum: ['music', 'concert', 'sports', 'conference', 'theater', 'workshop', 'festival', 'meetup', 'other']
    },
    date: { type: Date, required: [true, 'Event date is required'] },
    time: { type: String, required: [true, 'Event time is required'] },
    venue: { type: String, required: [true, 'Venue is required'] },
    location: { type: String, required: [true, 'Location is required'] },
    organizerId: { type: String, required: true },
    totalTickets: { type: Number, required: true, min: 1 },
    availableTickets: { type: Number, required: true, min: 0 },
    ticketPrice: { type: Number, required: true, min: 0 },
    imageUrl: { type: String, default: '' },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

eventSchema.index({ title: 'text', description: 'text', venue: 'text', location: 'text' });
eventSchema.index({ category: 1, date: 1 });
eventSchema.index({ ticketPrice: 1 });

module.exports = mongoose.model('Event', eventSchema);
