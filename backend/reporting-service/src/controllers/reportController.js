const axios = require('axios');
const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: 300 }); // 5 min cache

const USER_SERVICE = process.env.USER_SERVICE_URL || 'http://user-service:5001';
const EVENT_SERVICE = process.env.EVENT_SERVICE_URL || 'http://event-service:5002';
const PAYMENT_SERVICE = process.env.PAYMENT_SERVICE_URL || 'http://payment-service:5003';
const BOOKING_SERVICE = process.env.BOOKING_SERVICE_URL || 'http://booking-service:5004';
const SERVICE_KEY = process.env.SERVICE_KEY;
const serviceHeaders = { 'x-service-key': SERVICE_KEY };

// Helper: fetch with cache
async function fetchWithCache(key, url, headers = {}) {
  const cached = cache.get(key);
  if (cached) return cached;
  try {
    const { data } = await axios.get(url, { headers, timeout: 10000 });
    cache.set(key, data);
    return data;
  } catch (err) {
    console.error(`Failed to fetch ${url}:`, err.message);
    return null;
  }
}

async function fetchWithoutCache(url, headers = {}) {
  try {
    const { data } = await axios.get(url, { headers, timeout: 10000 });
    return data;
  } catch (err) {
    console.error(`Failed to fetch ${url}:`, err.message);
    return null;
  }
}

// ─── Dashboard Summary ───
exports.getDashboardSummary = async (req, res, next) => {
  try {
    const [eventsData, revenueData] = await Promise.all([
      fetchWithCache('events_list', `${EVENT_SERVICE}/api/events?limit=1000`, {}),
      fetchWithoutCache(`${PAYMENT_SERVICE}/api/payments/revenue`, serviceHeaders)
    ]);

    const totalEvents = eventsData?.pagination?.total || 0;
    const revenue = revenueData?.summary || { totalRevenue: 0, totalTransactions: 0, avgAmount: 0 };

    res.json({
      success: true,
      dashboard: {
        totalEvents,
        revenue,
        dailyRevenue: revenueData?.dailyRevenue || [],
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

// ─── Event Performance Report ───
exports.getEventPerformanceReport = async (req, res, next) => {
  try {
    const cacheKey = `event_perf_${req.params.eventId}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json({ success: true, report: cached, cached: true });

    const eventId = req.params.eventId;

    const [eventData, bookingsData] = await Promise.all([
      fetchWithCache(`event_${eventId}`, `${EVENT_SERVICE}/api/events/${eventId}`, {}),
      fetchWithCache(`event_bookings_${eventId}`, `${BOOKING_SERVICE}/api/bookings/event/${eventId}`, serviceHeaders)
    ]);

    const event = eventData?.event;
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

    const bookings = bookingsData?.bookings || [];
    const totalBooked = bookings.reduce((sum, b) => sum + b.ticketCount, 0);

    const report = {
      eventId,
      eventTitle: event.title,
      category: event.category,
      date: event.date,
      venue: event.venue,
      ticketsSold: totalBooked,
      totalTickets: event.totalTickets,
      availableTickets: event.availableTickets,
      occupancyRate: event.totalTickets > 0 ? Math.round((totalBooked / event.totalTickets) * 100) : 0,
      revenue: totalBooked * event.ticketPrice,
      averageRating: event.averageRating,
      totalReviews: event.totalReviews,
      totalBookings: bookings.length,
      generatedAt: new Date().toISOString()
    };

    cache.set(cacheKey, report);
    res.json({ success: true, report });
  } catch (error) {
    next(error);
  }
};

// ─── Revenue Report ───
exports.getRevenueReport = async (req, res, next) => {
  try {
    const revenueData = await fetchWithoutCache(`${PAYMENT_SERVICE}/api/payments/revenue`, serviceHeaders);

    res.json({
      success: true,
      revenue: revenueData?.summary || { totalRevenue: 0, totalTransactions: 0 },
      dailyBreakdown: revenueData?.dailyRevenue || [],
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

// ─── Platform Health ───
exports.getPlatformHealth = async (req, res, next) => {
  try {
    const services = [
      { name: 'user-service', url: `${USER_SERVICE}/health` },
      { name: 'event-service', url: `${EVENT_SERVICE}/health` },
      { name: 'payment-service', url: `${PAYMENT_SERVICE}/health` },
      { name: 'booking-service', url: `${BOOKING_SERVICE}/health` }
    ];

    const healthChecks = await Promise.allSettled(
      services.map(async (svc) => {
        try {
          const { data } = await axios.get(svc.url, { timeout: 5000 });
          return { name: svc.name, status: 'healthy', data };
        } catch {
          return { name: svc.name, status: 'unhealthy' };
        }
      })
    );

    const results = healthChecks.map((h) => (h.status === 'fulfilled' ? h.value : { name: 'unknown', status: 'unhealthy' }));
    const allHealthy = results.every((r) => r.status === 'healthy');

    res.json({
      success: true,
      overallStatus: allHealthy ? 'healthy' : 'degraded',
      services: results,
      checkedAt: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

// ─── Clear Cache ───
exports.clearCache = async (req, res) => {
  cache.flushAll();
  res.json({ success: true, message: 'Cache cleared.' });
};
