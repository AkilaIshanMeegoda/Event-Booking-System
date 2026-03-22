const Booking = require('../models/Booking');
const axios = require('axios');
const { validationResult } = require('express-validator');

const EVENT_SERVICE = process.env.EVENT_SERVICE_URL || 'http://event-service:5002';
const PAYMENT_SERVICE = process.env.PAYMENT_SERVICE_URL || 'http://payment-service:5003';
const NOTIFICATION_SERVICE = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:5006';
const USER_SERVICE = process.env.USER_SERVICE_URL || 'http://user-service:5001';
const SERVICE_KEY = process.env.SERVICE_KEY;

const serviceHeaders = { 'x-service-key': SERVICE_KEY };

// ─── SAGA: Create Booking ───
exports.createBooking = async (req, res, next) => {
  let ticketsReserved = false;
  let booking = null;

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { eventId, ticketCount, paymentMethodId } = req.body;
    const userId = req.user.id;

    // Step 1 — Check event availability via Event Service
    const { data: eventData } = await axios.get(`${EVENT_SERVICE}/api/events/${eventId}/availability`);
    if (!eventData.success || !eventData.isAvailable || eventData.availableTickets < ticketCount) {
      return res.status(400).json({ success: false, message: 'Not enough tickets available.' });
    }

    const totalAmount = eventData.ticketPrice * ticketCount;

    // Step 2 — Reserve tickets (decrement)
    await axios.put(`${EVENT_SERVICE}/api/events/${eventId}/tickets`, { action: 'decrement', count: ticketCount }, { headers: serviceHeaders });
    ticketsReserved = true;

    // Step 3 — Create booking record (pending)
    booking = await Booking.create({
      userId,
      userEmail: req.user.email || '',
      eventId,
      eventTitle: eventData.title,
      ticketCount,
      totalAmount,
      status: 'pending',
      paymentStatus: 'pending',
      eventDate: eventData.date || undefined,
      venue: eventData.venue || undefined
    });

    // Step 4 — Process payment via Payment Service
    let paymentResult;
    try {
      const { data } = await axios.post(`${PAYMENT_SERVICE}/api/payments`, {
        bookingId: booking._id.toString(),
        userId,
        amount: totalAmount,
        eventTitle: eventData.title,
        paymentMethodId,
        currency: 'usd'
      }, { headers: serviceHeaders });
      paymentResult = data;
    } catch (payError) {
      // Payment failed — compensate: release tickets + mark booking failed
      booking.status = 'failed';
      booking.paymentStatus = 'failed';
      await booking.save();

      await axios.put(`${EVENT_SERVICE}/api/events/${eventId}/tickets`, { action: 'increment', count: ticketCount }, { headers: serviceHeaders });

      return res.status(400).json({ success: false, message: 'Payment failed. Tickets released.', booking });
    }

    // Step 5 — Confirm booking
    booking.status = 'confirmed';
    booking.paymentStatus = 'completed';
    booking.paymentId = paymentResult.payment?._id || paymentResult.paymentId;
    await booking.save();

    // Step 6 — Send notification (fire-and-forget)
    axios.post(`${NOTIFICATION_SERVICE}/api/notifications`, {
      userId,
      type: 'booking_confirmation',
      title: 'Booking Confirmed',
      message: `Your booking for "${eventData.title}" (${ticketCount} tickets) has been confirmed. Total: $${totalAmount}`,
      metadata: { bookingId: booking._id.toString(), eventId }
    }, { headers: serviceHeaders }).catch(() => {}); // non-critical

    res.status(201).json({ success: true, message: 'Booking confirmed!', booking });
  } catch (error) {
    // Global compensate: if tickets were reserved but something else failed
    if (ticketsReserved && req.body.eventId) {
      try {
        await axios.put(`${EVENT_SERVICE}/api/events/${req.body.eventId}/tickets`, { action: 'increment', count: req.body.ticketCount }, { headers: serviceHeaders });
      } catch (_) {}
    }
    if (booking) {
      booking.status = 'failed';
      await booking.save().catch(() => {});
    }
    next(error);
  }
};

// ─── Get My Bookings ───
exports.getMyBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = { userId: req.user.id };
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [bookings, total] = await Promise.all([
      Booking.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Booking.countDocuments(filter)
    ]);

    res.json({ success: true, bookings, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } });
  } catch (error) {
    next(error);
  }
};

// ─── Get Booking By ID ───
exports.getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    // Users can only access own bookings, admins can access all
    if (req.user.role !== 'admin' && booking.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, booking });
  } catch (error) {
    next(error);
  }
};

// ─── Cancel Booking ───
exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    let refundStatus = 'not_applicable';
    let refundMessage = 'No refund was needed for this cancellation.';

    if (req.user.role !== 'admin' && booking.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    if (['cancelled', 'failed', 'refunded'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: `Cannot cancel a ${booking.status} booking.` });
    }

    // Release tickets back
    try {
      await axios.put(`${EVENT_SERVICE}/api/events/${booking.eventId}/tickets`, { action: 'increment', count: booking.ticketCount }, { headers: serviceHeaders });
    } catch (err) {
      console.error('Failed to release tickets:', err.message);
    }

    // Request refund if payment was completed
    if (booking.paymentId && booking.paymentStatus === 'completed') {
      try {
        await axios.put(`${PAYMENT_SERVICE}/api/payments/${booking.paymentId}/refund`, {}, { headers: serviceHeaders });
        booking.paymentStatus = 'refunded';
        refundStatus = 'success';
        refundMessage = `Your refund for "${booking.eventTitle}" has been processed successfully.`;
      } catch (err) {
        console.error('Refund failed:', err.message);
        refundStatus = 'failed';
        refundMessage = `We cancelled your booking for "${booking.eventTitle}", but refund processing failed. Please contact support.`;
      }
    } else {
      refundMessage = `Booking for "${booking.eventTitle}" was cancelled. No completed payment was found to refund.`;
    }

    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancelReason = req.body.reason || 'User requested cancellation';
    await booking.save();

    // Notification (fire-and-forget)
    axios.post(`${NOTIFICATION_SERVICE}/api/notifications`, {
      userId: booking.userId,
      type: 'booking_cancellation',
      title: 'Booking Cancelled',
      message: `Your booking for "${booking.eventTitle}" has been cancelled.`,
      metadata: { bookingId: booking._id.toString(), eventId: booking.eventId }
    }, { headers: serviceHeaders }).catch(() => {});

    // Refund outcome notification (fire-and-forget)
    axios.post(`${NOTIFICATION_SERVICE}/api/notifications`, {
      userId: booking.userId,
      type: refundStatus === 'failed' ? 'payment_failed' : 'payment_refund',
      title: refundStatus === 'success' ? 'Refund Successful' : refundStatus === 'failed' ? 'Refund Failed' : 'Refund Update',
      message: refundMessage,
      metadata: {
        bookingId: booking._id.toString(),
        eventId: booking.eventId,
        paymentId: booking.paymentId || undefined
      }
    }, { headers: serviceHeaders }).catch(() => {});

    res.json({ success: true, message: 'Booking cancelled', booking });
  } catch (error) {
    next(error);
  }
};

// ─── Get All Bookings (Admin) ───
exports.getAllBookings = async (req, res, next) => {
  try {
    const { status, eventId, userId, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (eventId) filter.eventId = eventId;
    if (userId) filter.userId = userId;

    const skip = (Number(page) - 1) * Number(limit);
    const [bookings, total] = await Promise.all([
      Booking.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Booking.countDocuments(filter)
    ]);

    // Enrich bookings that are missing userEmail by batch-looking up from User Service
    const missingIds = [...new Set(
      bookings.filter(b => !b.userEmail).map(b => b.userId)
    )];
    let emailMap = {};
    if (missingIds.length > 0) {
      try {
        const { data } = await axios.post(
          `${USER_SERVICE}/api/users/by-ids`,
          { ids: missingIds },
          { headers: serviceHeaders }
        );
        emailMap = data.emailMap || {};
      } catch (err) {
        console.error('Failed to fetch user emails:', err.message);
      }
    }

    const enriched = bookings.map(b => {
      const obj = b.toObject();
      if (!obj.userEmail) obj.userEmail = emailMap[obj.userId] || obj.userId;
      return obj;
    });

    res.json({ success: true, bookings: enriched, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } });
  } catch (error) {
    next(error);
  }
};

// ─── Get Bookings by Event (Service-to-Service) ───
exports.getBookingsByEvent = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ eventId: req.params.eventId, status: 'confirmed' });
    res.json({ success: true, bookings, count: bookings.length });
  } catch (error) {
    next(error);
  }
};

// ─── Get Bookings by User (Service-to-Service) ───
exports.getBookingsByUser = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ userId: req.params.userId });
    res.json({ success: true, bookings });
  } catch (error) {
    next(error);
  }
};
