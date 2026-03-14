const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');
const { serviceAuth } = require('../middleware/serviceAuth');
const { createBookingValidator } = require('../validators/bookingValidator');
const bookingController = require('../controllers/bookingController');

/**
 * @swagger
 * components:
 *   schemas:
 *     Booking:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         userId:
 *           type: string
 *         eventId:
 *           type: string
 *         eventTitle:
 *           type: string
 *         ticketCount:
 *           type: integer
 *         totalAmount:
 *           type: number
 *         status:
 *           type: string
 *           enum: [pending, confirmed, cancelled, failed, refunded]
 *         paymentId:
 *           type: string
 *         paymentStatus:
 *           type: string
 *           enum: [pending, completed, failed, refunded]
 */

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create a new booking (saga flow)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [eventId, ticketCount]
 *             properties:
 *               eventId:
 *                 type: string
 *               ticketCount:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *     responses:
 *       201:
 *         description: Booking confirmed
 *       400:
 *         description: Booking/payment failed
 */
router.post('/', auth, createBookingValidator, bookingController.createBooking);

/**
 * @swagger
 * /api/bookings/my:
 *   get:
 *     summary: Get my bookings
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: User's bookings
 */
router.get('/my', auth, bookingController.getMyBookings);

/**
 * @swagger
 * /api/bookings/all:
 *   get:
 *     summary: Get all bookings (admin)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All bookings
 */
router.get('/all', auth, roleCheck('admin'), bookingController.getAllBookings);

/**
 * @swagger
 * /api/bookings/{id}:
 *   get:
 *     summary: Get booking by ID
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Booking details
 */
router.get('/:id', auth, bookingController.getBookingById);

/**
 * @swagger
 * /api/bookings/{id}/cancel:
 *   put:
 *     summary: Cancel a booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Booking cancelled
 */
router.put('/:id/cancel', auth, bookingController.cancelBooking);

// ─── Service-to-Service Endpoints ───
/**
 * @swagger
 * /api/bookings/event/{eventId}:
 *   get:
 *     summary: Get bookings by event (service-to-service)
 *     tags: [Bookings - Internal]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema: { type: string }
 *       - in: header
 *         name: x-service-key
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Event bookings
 */
router.get('/event/:eventId', serviceAuth, bookingController.getBookingsByEvent);

/**
 * @swagger
 * /api/bookings/user/{userId}:
 *   get:
 *     summary: Get bookings by user (service-to-service)
 *     tags: [Bookings - Internal]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *       - in: header
 *         name: x-service-key
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User bookings
 */
router.get('/user/:userId', serviceAuth, bookingController.getBookingsByUser);

module.exports = router;
