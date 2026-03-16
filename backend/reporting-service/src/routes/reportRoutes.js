const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');
const reportController = require('../controllers/reportController');

/**
 * @swagger
 * /api/reports/dashboard:
 *   get:
 *     summary: Get dashboard summary (admin)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary with events, revenue data
 */
router.get('/dashboard', auth, roleCheck('admin'), reportController.getDashboardSummary);

/**
 * @swagger
 * /api/reports/events/{eventId}:
 *   get:
 *     summary: Get event performance report (admin)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Event performance report with occupancy, revenue, reviews
 */
router.get('/events/:eventId', auth, roleCheck('admin'), reportController.getEventPerformanceReport);

/**
 * @swagger
 * /api/reports/revenue:
 *   get:
 *     summary: Get revenue report (admin)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Revenue report with daily breakdown
 */
router.get('/revenue', auth, roleCheck('admin'), reportController.getRevenueReport);

/**
 * @swagger
 * /api/reports/health:
 *   get:
 *     summary: Get platform health status (admin)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Health check of all microservices
 */
router.get('/health', auth, roleCheck('admin'), reportController.getPlatformHealth);

/**
 * @swagger
 * /api/reports/cache/clear:
 *   post:
 *     summary: Clear reporting cache (admin)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cache cleared
 */
router.post('/cache/clear', auth, roleCheck('admin'), reportController.clearCache);

module.exports = router;
