const Event = require('../models/Event');
const { validationResult } = require('express-validator');

// GET /api/events — public, with search/filter/sort/pagination
exports.getAllEvents = async (req, res, next) => {
  try {
    const { search, category, startDate, endDate, minPrice, maxPrice, available, sortBy, page = 1, limit = 12 } = req.query;
    const filter = { isActive: true };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { venue: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    if (minPrice || maxPrice) {
      filter.ticketPrice = {};
      if (minPrice) filter.ticketPrice.$gte = Number(minPrice);
      if (maxPrice) filter.ticketPrice.$lte = Number(maxPrice);
    }
    if (available === 'true') filter.availableTickets = { $gt: 0 };

    let sortOption = { date: 1 };
    if (sortBy === 'price_asc') sortOption = { ticketPrice: 1 };
    else if (sortBy === 'price_desc') sortOption = { ticketPrice: -1 };
    else if (sortBy === 'rating') sortOption = { averageRating: -1 };
    else if (sortBy === 'newest') sortOption = { createdAt: -1 };

    const skip = (Number(page) - 1) * Number(limit);
    const [events, total] = await Promise.all([
      Event.find(filter).sort(sortOption).skip(skip).limit(Number(limit)),
      Event.countDocuments(filter)
    ]);

    res.json({
      success: true,
      events,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/events/:id
exports.getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event || !event.isActive) return res.status(404).json({ success: false, message: 'Event not found.' });
    res.json({ success: true, event });
  } catch (error) {
    next(error);
  }
};

// GET /api/events/:id/availability
exports.checkAvailability = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).select('availableTickets totalTickets ticketPrice title date venue');
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
    res.json({
      success: true,
      eventId: event._id,
      title: event.title,
      availableTickets: event.availableTickets,
      totalTickets: event.totalTickets,
      ticketPrice: event.ticketPrice,
      isAvailable: event.availableTickets > 0,
      date: event.date,
      venue: event.venue
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/events — Admin/Organizer
exports.createEvent = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const eventData = { ...req.body, organizerId: req.user.id, availableTickets: req.body.totalTickets };
    const event = await Event.create(eventData);
    res.status(201).json({ success: true, message: 'Event created successfully', event });
  } catch (error) {
    next(error);
  }
};

// PUT /api/events/:id
exports.updateEvent = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

    // Organizer can only update own events
    if (req.user.role === 'organizer' && event.organizerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only update your own events.' });
    }

    Object.assign(event, req.body);
    await event.save();
    res.json({ success: true, message: 'Event updated', event });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/events/:id — Admin only (soft delete)
exports.deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
    res.json({ success: true, message: 'Event deleted', event });
  } catch (error) {
    next(error);
  }
};

// PUT /api/events/:id/tickets — Service-to-Service (decrement/increment)
exports.updateTickets = async (req, res, next) => {
  try {
    const { action, count } = req.body; // action: 'decrement' or 'increment'
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

    if (action === 'decrement') {
      if (event.availableTickets < count) {
        return res.status(400).json({ success: false, message: 'Not enough tickets available.' });
      }
      event.availableTickets -= count;
    } else if (action === 'increment') {
      event.availableTickets = Math.min(event.availableTickets + count, event.totalTickets);
    }

    await event.save();
    res.json({ success: true, availableTickets: event.availableTickets });
  } catch (error) {
    next(error);
  }
};

// PUT /api/events/:id/rating — Service-to-Service
exports.updateRating = async (req, res, next) => {
  try {
    const { averageRating, totalReviews } = req.body;
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { averageRating, totalReviews },
      { new: true }
    );
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
    res.json({ success: true, event });
  } catch (error) {
    next(error);
  }
};
