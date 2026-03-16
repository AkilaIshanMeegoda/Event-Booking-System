const Review = require('../models/Review');
const axios = require('axios');
const { validationResult } = require('express-validator');

const EVENT_SERVICE = process.env.EVENT_SERVICE_URL || 'http://event-service:5002';
const NOTIFICATION_SERVICE = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:5006';
const SERVICE_KEY = process.env.SERVICE_KEY;
const serviceHeaders = { 'x-service-key': SERVICE_KEY };

// Helper: Recalculate and push rating to Event Service
async function updateEventRating(eventId) {
  const stats = await Review.aggregate([
    { $match: { eventId, isActive: true } },
    { $group: { _id: null, averageRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } }
  ]);

  const { averageRating = 0, totalReviews = 0 } = stats[0] || {};
  try {
    await axios.put(`${EVENT_SERVICE}/api/events/${eventId}/rating`, {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews
    }, { headers: serviceHeaders });
  } catch (err) {
    console.error('Failed to update event rating:', err.message);
  }
}

// ─── Create Review ───
exports.createReview = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { eventId, rating, title, comment, eventTitle } = req.body;

    const review = await Review.create({
      userId: req.user.id,
      userName: req.user.name || 'Anonymous',
      eventId,
      eventTitle,
      rating,
      title,
      comment
    });

    // Update event rating
    await updateEventRating(eventId);

    // Notification (fire-and-forget)
    axios.post(`${NOTIFICATION_SERVICE}/api/notifications`, {
      userId: req.user.id,
      type: 'review_posted',
      title: 'Review Posted',
      message: `Your review for "${eventTitle || eventId}" has been posted.`,
      metadata: { reviewId: review._id.toString(), eventId }
    }, { headers: serviceHeaders }).catch(() => {});

    res.status(201).json({ success: true, message: 'Review created', review });
  } catch (error) {
    next(error);
  }
};

// ─── Get Reviews by Event ───
exports.getReviewsByEvent = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sortBy } = req.query;
    const filter = { eventId: req.params.eventId, isActive: true };

    let sort = { createdAt: -1 };
    if (sortBy === 'rating_high') sort = { rating: -1 };
    else if (sortBy === 'rating_low') sort = { rating: 1 };
    else if (sortBy === 'oldest') sort = { createdAt: 1 };

    const skip = (Number(page) - 1) * Number(limit);
    const [reviews, total] = await Promise.all([
      Review.find(filter).sort(sort).skip(skip).limit(Number(limit)),
      Review.countDocuments(filter)
    ]);

    // Calculate rating distribution
    const distribution = await Review.aggregate([
      { $match: filter },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ]);

    res.json({
      success: true,
      reviews,
      ratingDistribution: distribution,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get My Reviews ───
exports.getMyReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ userId: req.user.id, isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (error) {
    next(error);
  }
};

// ─── Update Review ───
exports.updateReview = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });

    if (review.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only update your own reviews.' });
    }

    const { rating, title, comment } = req.body;
    if (rating) review.rating = rating;
    if (title) review.title = title;
    if (comment) review.comment = comment;
    await review.save();

    // Recalculate
    await updateEventRating(review.eventId);

    res.json({ success: true, message: 'Review updated', review });
  } catch (error) {
    next(error);
  }
};

// ─── Delete Review ───
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });

    if (review.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    review.isActive = false;
    await review.save();

    await updateEventRating(review.eventId);

    res.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    next(error);
  }
};

// ─── Get Event Rating Summary (Service-to-Service) ───
exports.getEventRatingSummary = async (req, res, next) => {
  try {
    const stats = await Review.aggregate([
      { $match: { eventId: req.params.eventId, isActive: true } },
      { $group: { _id: null, averageRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } }
    ]);
    res.json({ success: true, ...(stats[0] || { averageRating: 0, totalReviews: 0 }) });
  } catch (error) {
    next(error);
  }
};
