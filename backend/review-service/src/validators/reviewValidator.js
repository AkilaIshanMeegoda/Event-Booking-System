const { body } = require('express-validator');

exports.createReviewValidator = [
  body('eventId').notEmpty().withMessage('Event ID is required').isMongoId().withMessage('Invalid event ID'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  body('comment').trim().notEmpty().withMessage('Comment is required').isLength({ max: 2000 })
];

exports.updateReviewValidator = [
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
  body('title').optional().trim().isLength({ max: 200 }),
  body('comment').optional().trim().isLength({ max: 2000 })
];
