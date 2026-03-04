const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { serviceAuth } = require('../middleware/serviceAuth');
const { createEventValidator, updateEventValidator } = require('../validators/eventValidator');
const eventController = require('../controllers/eventController');

/**
 * @swagger
 * components:
 *   schemas:
 *     Event:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         category:
 *           type: string
 *           enum: [conference, concert, sports, theater, workshop, festival, meetup, other]
 *         date:
 *           type: string
 *           format: date
 *         time:
 *           type: string
 *         venue:
 *           type: string
 *         location:
 *           type: string
 *         organizerId:
 *           type: string
 *         totalTickets:
 *           type: integer
 *         availableTickets:
 *           type: integer
 *         ticketPrice:
 *           type: number
 *         imageUrl:
 *           type: string
 *         averageRating:
 *           type: number
 *         totalReviews:
 *           type: integer
 *         isActive:
 *           type: boolean
 */

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Get all events with search/filter/pagination
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: minPrice
 *         schema: { type: number }
 *       - in: query
 *         name: maxPrice
 *         schema: { type: number }
 *       - in: query
 *         name: available
 *         schema: { type: boolean }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [price_asc, price_desc, rating, newest] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 12 }
 *     responses:
 *       200:
 *         description: List of events with pagination
 */
router.get('/', eventController.getAllEvents);

/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: Get single event by ID
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Event details
 *       404:
 *         description: Event not found
 */
router.get('/:id', eventController.getEventById);

/**
 * @swagger
 * /api/events/{id}/availability:
 *   get:
 *     summary: Check ticket availability
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Availability info
 */
router.get('/:id/availability', eventController.checkAvailability);

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Create a new event (admin/organizer)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Event'
 *     responses:
 *       201:
 *         description: Event created
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 */
router.post('/', auth, roleCheck('admin', 'organizer'), createEventValidator, eventController.createEvent);

/**
 * @swagger
 * /api/events/{id}:
 *   put:
 *     summary: Update an event (admin/organizer)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Event'
 *     responses:
 *       200:
 *         description: Event updated
 */
router.put('/:id', auth, roleCheck('admin', 'organizer'), updateEventValidator, eventController.updateEvent);

/**
 * @swagger
 * /api/events/{id}:
 *   delete:
 *     summary: Delete an event (admin only, soft delete)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Event deleted (soft)
 */
router.delete('/:id', auth, roleCheck('admin'), eventController.deleteEvent);

/**
 * @swagger
 * /api/events/{id}/tickets:
 *   put:
 *     summary: Update ticket count (service-to-service)
 *     tags: [Events - Internal]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
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
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [decrement, increment]
 *               count:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Tickets updated
 */
router.put('/:id/tickets', serviceAuth, eventController.updateTickets);

/**
 * @swagger
 * /api/events/{id}/rating:
 *   put:
 *     summary: Update event rating (service-to-service)
 *     tags: [Events - Internal]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: header
 *         name: x-service-key
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Rating updated
 */
router.put('/:id/rating', serviceAuth, eventController.updateRating);

module.exports = router;
