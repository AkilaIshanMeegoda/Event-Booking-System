const Payment = require('../models/Payment');

const stripe = process.env.STRIPE_SECRET_KEY
  ? require('stripe')(process.env.STRIPE_SECRET_KEY)
  : null;

const toStripeAmount = (amount) => Math.round(Number(amount) * 100);

const getStripeErrorMessage = (error) => {
  if (error?.type === 'StripeCardError') return error.message || 'Card was declined.';
  if (error?.type === 'StripeInvalidRequestError') return error.message || 'Invalid Stripe payment request.';
  return 'Payment processing failed.';
};

// ─── Process Payment (Service-to-Service, called by Booking Service) ───
exports.processPayment = async (req, res, next) => {
  try {
    const { bookingId, userId, amount, eventTitle, currency = 'usd', paymentMethodId } = req.body;

    if (!bookingId || !userId || !amount) {
      return res.status(400).json({ success: false, message: 'bookingId, userId, and amount are required.' });
    }

    const normalizedAmount = Number(amount);
    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'amount must be a positive number.' });
    }

    const payment = new Payment({
      bookingId,
      userId,
      amount: normalizedAmount,
      eventTitle,
      currency: String(currency).toUpperCase(),
      status: 'pending',
      paymentMethod: stripe ? 'stripe' : 'simulated_card'
    });

    if (!stripe) {
      // Fallback mode for local environments where Stripe keys are not configured.
      await new Promise((resolve) => setTimeout(resolve, 1500));
      payment.status = 'completed';
      await payment.save();
      return res.status(201).json({
        success: true,
        message: 'Payment successful (simulation mode: STRIPE_SECRET_KEY not set)',
        payment
      });
    }

    if (!paymentMethodId) {
      return res.status(400).json({
        success: false,
        message: 'paymentMethodId is required for Stripe payments.'
      });
    }

    const stripeAmount = toStripeAmount(normalizedAmount);
    if (!Number.isInteger(stripeAmount) || stripeAmount <= 0) {
      return res.status(400).json({ success: false, message: 'amount is invalid for Stripe.' });
    }

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: stripeAmount,
        currency: String(currency).toLowerCase(),
        payment_method: paymentMethodId,
        confirm: true,
        automatic_payment_methods: { enabled: false },
        metadata: {
          bookingId,
          userId,
          eventTitle: eventTitle || ''
        }
      });

      if (paymentIntent.status !== 'succeeded') {
        payment.status = 'failed';
        payment.failureReason = `Stripe intent status: ${paymentIntent.status}`;
        payment.stripePaymentIntentId = paymentIntent.id;
        payment.transactionId = paymentIntent.id;
        await payment.save();
        return res.status(402).json({
          success: false,
          message: `Payment failed: ${paymentIntent.status}`,
          payment
        });
      }

      payment.status = 'completed';
      payment.stripePaymentIntentId = paymentIntent.id;
      payment.transactionId = paymentIntent.id;
      await payment.save();
      res.status(201).json({ success: true, message: 'Payment successful', payment });
    } catch (stripeError) {
      payment.status = 'failed';
      payment.failureReason = getStripeErrorMessage(stripeError);
      await payment.save();
      res.status(402).json({ success: false, message: `Payment failed: ${payment.failureReason}`, payment });
    }
  } catch (error) {
    next(error);
  }
};

// ─── Refund Payment (Service-to-Service) ───
exports.refundPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found.' });

    if (payment.status !== 'completed') {
      return res.status(400).json({ success: false, message: `Cannot refund a ${payment.status} payment.` });
    }

    if (stripe && payment.stripePaymentIntentId) {
      const refund = await stripe.refunds.create({ payment_intent: payment.stripePaymentIntentId });
      payment.stripeRefundId = refund.id;
    }

    payment.status = 'refunded';
    payment.refundedAt = new Date();
    await payment.save();

    res.json({ success: true, message: 'Payment refunded', payment });
  } catch (error) {
    next(error);
  }
};

// ─── Get Payment by ID (Auth required) ───
exports.getPaymentById = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found.' });

    if (req.user.role !== 'admin' && payment.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, payment });
  } catch (error) {
    next(error);
  }
};

// ─── Get Payment by Booking ID (Service-to-Service) ───
exports.getPaymentByBooking = async (req, res, next) => {
  try {
    const payment = await Payment.findOne({ bookingId: req.params.bookingId });
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found.' });
    res.json({ success: true, payment });
  } catch (error) {
    next(error);
  }
};

// ─── Get All Payments (Admin) ───
exports.getAllPayments = async (req, res, next) => {
  try {
    const { status, userId, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (userId) filter.userId = userId;

    const skip = (Number(page) - 1) * Number(limit);
    const [payments, total] = await Promise.all([
      Payment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Payment.countDocuments(filter)
    ]);

    res.json({ success: true, payments, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } });
  } catch (error) {
    next(error);
  }
};

// ─── Revenue Summary (Service-to-Service / Admin) ───
exports.getRevenueSummary = async (req, res, next) => {
  try {
    const summary = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, totalRevenue: { $sum: '$amount' }, totalTransactions: { $sum: 1 }, avgAmount: { $avg: '$amount' } } }
    ]);

    const recent = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, dailyRevenue: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
      { $limit: 30 }
    ]);

    res.json({
      success: true,
      summary: summary[0] || { totalRevenue: 0, totalTransactions: 0, avgAmount: 0 },
      dailyRevenue: recent
    });
  } catch (error) {
    next(error);
  }
};
