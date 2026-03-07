const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');
const { serviceAuth } = require('../middleware/serviceAuth');
const { createReviewValidator, updateReviewValidator } = require('../validators/reviewValidator');
const reviewController = require('../controllers/reviewController');

/**
 * @swagger
 * components:
 *   schemas:
 *     Review:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         userId:
 *           type: string
 *         userName:
 *           type: string
 *         eventId:
 *           type: string
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         title:
 *           type: string
 *         comment:
 *           type: string
 *         isActive:
 *           type: boolean
 */

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Create a review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [eventId, rating, title, comment]
 *             properties:
 *               eventId: { type: string }
 *               rating: { type: integer, minimum: 1, maximum: 5 }
 *               title: { type: string }
 *               comment: { type: string }
 *               eventTitle: { type: string }
 *     responses:
 *       201:
 *         description: Review created
 */
router.post('/', auth, createReviewValidator, reviewController.createReview);

/**
 * @swagger
 * /api/reviews/my:
 *   get:
 *     summary: Get my reviews
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's reviews
 */
router.get('/my', auth, reviewController.getMyReviews);

/**
 * @swagger
 * /api/reviews/event/{eventId}:
 *   get:
 *     summary: Get reviews for an event
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [rating_high, rating_low, oldest, newest] }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Event reviews with rating distribution
 */
router.get('/event/:eventId', reviewController.getReviewsByEvent);

/**
 * @swagger
 * /api/reviews/event/{eventId}/summary:
 *   get:
 *     summary: Get event rating summary (service-to-service)
 *     tags: [Reviews - Internal]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Rating summary
 */
router.get('/event/:eventId/summary', serviceAuth, reviewController.getEventRatingSummary);

/**
 * @swagger
 * /api/reviews/{id}:
 *   put:
 *     summary: Update a review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Review updated
 */
router.put('/:id', auth, updateReviewValidator, reviewController.updateReview);

/**
 * @swagger
 * /api/reviews/{id}:
 *   delete:
 *     summary: Delete a review (soft delete)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Review deleted
 */
router.delete('/:id', auth, reviewController.deleteReview);

module.exports = router;
