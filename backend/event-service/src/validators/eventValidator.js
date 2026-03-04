const { body } = require('express-validator');

exports.createEventValidator = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }).withMessage('Title max 200 chars'),
  body('description').trim().notEmpty().withMessage('Description is required').isLength({ max: 5000 }),
  body('category').isIn(['music', 'conference', 'concert', 'sports', 'theater', 'workshop', 'festival', 'meetup', 'other']).withMessage('Invalid category'),
  body('date').isISO8601().withMessage('Valid date required'),
  body('time').trim().notEmpty().withMessage('Time is required'),
  body('venue').trim().notEmpty().withMessage('Venue is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('totalTickets').isInt({ min: 1 }).withMessage('Total tickets must be >= 1'),
  body('ticketPrice').isFloat({ min: 0 }).withMessage('Ticket price must be >= 0'),
  body('imageUrl').optional().isURL().withMessage('Image must be a valid URL')
];

exports.updateEventValidator = [
  body('title').optional().trim().isLength({ max: 200 }),
  body('description').optional().trim().isLength({ max: 5000 }),
  body('category').optional().isIn(['music', 'conference', 'concert', 'sports', 'theater', 'workshop', 'festival', 'meetup', 'other']),
  body('date').optional().isISO8601(),
  body('time').optional().trim(),
  body('venue').optional().trim(),
  body('location').optional().trim(),
  body('totalTickets').optional().isInt({ min: 1 }),
  body('ticketPrice').optional().isFloat({ min: 0 }),
  body('imageUrl').optional().isURL()
];
