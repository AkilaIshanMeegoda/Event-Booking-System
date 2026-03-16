const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const Booking = require('../src/models/Booking');

jest.setTimeout(30000);

beforeAll(async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/booking-service-test';
  await mongoose.connect(uri);
});

afterAll(async () => {
  await Booking.deleteMany({});
  await mongoose.connection.close();
});

describe('Booking Service', () => {
  describe('GET /health', () => {
    it('should return service health', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.service).toBe('booking-service');
    });
  });

  describe('POST /api/bookings', () => {
    it('should reject unauthenticated requests', async () => {
      const res = await request(app).post('/api/bookings').send({ eventId: '507f1f77bcf86cd799439011', ticketCount: 1 });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/bookings/my', () => {
    it('should reject unauthenticated requests', async () => {
      const res = await request(app).get('/api/bookings/my');
      expect(res.statusCode).toBe(401);
    });
  });
});
