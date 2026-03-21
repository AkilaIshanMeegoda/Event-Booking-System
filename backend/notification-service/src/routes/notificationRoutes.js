const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { serviceAuth } = require('../middleware/serviceAuth');
const notificationController = require('../controllers/notificationController');

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         userId:
 *           type: string
 *         type:
 *           type: string
 *           enum: [booking_confirmation, booking_cancellation, payment_success, payment_failed, payment_refund, review_posted, event_reminder, general]
 *         title:
 *           type: string
 *         message:
 *           type: string
 *         isRead:
 *           type: boolean
 *         metadata:
 *           type: object
 */

/**
 * @swagger
 * /api/notifications:
 *   post:
 *     summary: Create notification (service-to-service)
 *     tags: [Notifications]
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
 *             required: [userId, type, title, message]
 *             properties:
 *               userId: { type: string }
 *               type: { type: string }
 *               title: { type: string }
 *               message: { type: string }
 *               metadata: { type: object }
 *     responses:
 *       201:
 *         description: Notification created
 */
router.post('/', serviceAuth, notificationController.createNotification);

/**
 * @swagger
 * /api/notifications/my:
 *   get:
 *     summary: Get my notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isRead
 *         schema: { type: boolean }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: User notifications with unread count
 */
router.get('/my', auth, notificationController.getMyNotifications);

/**
 * @swagger
 * /api/notifications/read-all:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All marked as read
 */
router.put('/read-all', auth, notificationController.markAllAsRead);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   put:
 *     summary: Mark single notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
router.put('/:id/read', auth, notificationController.markAsRead);

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Notification deleted
 */
router.delete('/:id', auth, notificationController.deleteNotification);

// Service-to-Service
/**
 * @swagger
 * /api/notifications/user/{userId}:
 *   get:
 *     summary: Get notifications by user (service-to-service)
 *     tags: [Notifications - Internal]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User notifications
 */
router.get('/user/:userId', serviceAuth, notificationController.getNotificationsByUser);

module.exports = router;
