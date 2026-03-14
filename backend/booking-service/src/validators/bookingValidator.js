const { body } = require('express-validator');

exports.createBookingValidator = [
  body('eventId').notEmpty().withMessage('Event ID is required').isMongoId().withMessage('Invalid event ID'),
  body('ticketCount').isInt({ min: 1, max: 10 }).withMessage('Ticket count must be 1-10')
];
