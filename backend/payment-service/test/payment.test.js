const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const Payment = require('../src/models/Payment');

beforeAll(async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/payment-service-test';
  await mongoose.connect(uri);
});

afterAll(async () => {
  await Payment.deleteMany({});
  await mongoose.connection.close();
});

describe('Payment Service', () => {
  describe('GET /health', () => {
    it('should return service health', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.service).toBe('payment-service');
    });
  });

  describe('POST /api/payments', () => {
    it('should reject requests without service key', async () => {
      const res = await request(app).post('/api/payments').send({ bookingId: 'test', userId: 'test', amount: 100 });
      expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /api/payments/all', () => {
    it('should reject unauthenticated requests', async () => {
      const res = await request(app).get('/api/payments/all');
      expect(res.statusCode).toBe(401);
    });
  });
});
