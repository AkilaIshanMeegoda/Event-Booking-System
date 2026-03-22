const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');
const { serviceAuth } = require('../middleware/serviceAuth');
const paymentController = require('../controllers/paymentController');

/**
 * @swagger
 * components:
 *   schemas:
 *     Payment:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         bookingId:
 *           type: string
 *         userId:
 *           type: string
 *         amount:
 *           type: number
 *         currency:
 *           type: string
 *         status:
 *           type: string
 *           enum: [pending, completed, failed, refunded]
 *         transactionId:
 *           type: string
 *         paymentMethod:
 *           type: string
 */

/**
 * @swagger
 * /api/payments:
 *   post:
 *     summary: Process a payment (service-to-service)
 *     tags: [Payments]
 *     parameters:
 *       - in: header
 *         name: x-service-key
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookingId, userId, amount]
 *             properties:
 *               bookingId: { type: string }
 *               userId: { type: string }
 *               amount: { type: number }
 *               eventTitle: { type: string }
 *               currency: { type: string, example: usd }
 *               paymentMethodId: { type: string, description: Stripe PaymentMethod id from frontend }
 *     responses:
 *       201:
 *         description: Payment successful
 *       402:
 *         description: Payment failed
 */
router.post('/', serviceAuth, paymentController.processPayment);

/**
 * @swagger
 * /api/payments/all:
 *   get:
 *     summary: Get all payments (admin)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All payments
 */
router.get('/all', auth, roleCheck('admin'), paymentController.getAllPayments);

/**
 * @swagger
 * /api/payments/revenue:
 *   get:
 *     summary: Get revenue summary (admin / service)
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Revenue summary
 */
router.get('/revenue', serviceAuth, paymentController.getRevenueSummary);

/**
 * @swagger
 * /api/payments/booking/{bookingId}:
 *   get:
 *     summary: Get payment by booking ID (service-to-service)
 *     tags: [Payments - Internal]
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Payment details
 */
router.get('/booking/:bookingId', serviceAuth, paymentController.getPaymentByBooking);

/**
 * @swagger
 * /api/payments/{id}:
 *   get:
 *     summary: Get payment by ID
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Payment details
 */
router.get('/:id', auth, paymentController.getPaymentById);

/**
 * @swagger
 * /api/payments/{id}/refund:
 *   put:
 *     summary: Refund payment (service-to-service)
 *     tags: [Payments - Internal]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Payment refunded
 */
router.put('/:id/refund', serviceAuth, paymentController.refundPayment);

module.exports = router;
